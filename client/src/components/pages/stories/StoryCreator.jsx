import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { X, RefreshCw, Zap, Sparkles, Glasses, Loader2, Video, Camera as CameraIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Changed to uploadBytes for blobs
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../../lib/firebase';

const FILTERS = [
  { id: 'none', name: 'Normal', icon: <X size={20} /> },
  { id: 'mesh', name: 'Cyber', icon: <Zap size={20} /> },
  { id: 'clown', name: 'Clown', icon: <RefreshCw size={20} /> },
  { id: 'mask', name: 'Hero', icon: <Glasses size={20} /> },
];

export default function StoryCreator({ onClose, currentUser }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const latestLandmarksRef = useRef(null); // Store landmarks for the render loop

  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);

  // --- 1. RENDER LOOP (Draws Video + AR to Canvas) ---
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;

    if (canvas && video && video.readyState === 4) {
      const ctx = canvas.getContext('2d');
      const { width, height } = canvas;

      // A. Draw Webcam Feed (Mirrored)
      ctx.save();
      ctx.scale(-1, 1); 
      ctx.drawImage(video, -width, 0, width, height);
      ctx.restore();

      // B. Draw AR Filters (if landmarks exist)
      if (latestLandmarksRef.current) {
        const landmarks = latestLandmarksRef.current;
        
        if (selectedFilter === 'mesh') {
          ctx.fillStyle = '#00FF00';
          // Mirror landmarks logic: x becomes (1 - x)
          landmarks.forEach(pt => {
            const x = (1 - pt.x) * width; 
            const y = pt.y * height;
            ctx.fillRect(x, y, 2, 2);
          });
        } 
        else if (selectedFilter === 'clown') {
          const nose = landmarks[1];
          const x = (1 - nose.x) * width;
          const y = nose.y * height;
          
          ctx.beginPath();
          ctx.arc(x, y, 40, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.fill();
          // Shine
          ctx.beginPath();
          ctx.arc(x - 10, y - 10, 10, 0, 2 * Math.PI);
          ctx.fillStyle = 'white';
          ctx.fill();
        }
        else if (selectedFilter === 'mask') {
           const leftEye = landmarks[33];
           const rightEye = landmarks[263];
           const center = landmarks[168];

           // Flip X coords
           const lx = (1 - leftEye.x) * width;
           const rx = (1 - rightEye.x) * width;
           const cx = (1 - center.x) * width;
           
           ctx.beginPath();
           ctx.moveTo(lx + 40, leftEye.y * height); // Swap offsets because flipped
           ctx.quadraticCurveTo(cx, center.y * height - 80, rx - 40, rightEye.y * height);
           ctx.lineTo(rx - 30, rightEye.y * height + 50);
           ctx.quadraticCurveTo(cx, center.y * height + 50, lx + 30, leftEye.y * height + 50);
           ctx.closePath();
           
           ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
           ctx.fill();
           ctx.strokeStyle = '#FFD700';
           ctx.lineWidth = 4;
           ctx.stroke();
        }
      }
    }
    requestAnimationFrame(drawScene);
  }, [selectedFilter]);

  // --- 2. MEDIAPIPE SETUP ---
  const onResults = useCallback((results) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      latestLandmarksRef.current = results.multiFaceLandmarks[0];
    } else {
      latestLandmarksRef.current = null;
    }
  }, []);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5 });
    faceMesh.onResults(onResults);

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => await faceMesh.send({ image: webcamRef.current.video }),
        width: 640,
        height: 480,
      });
      camera.start().then(() => {
        setCameraReady(true);
        requestAnimationFrame(drawScene); // Start the custom render loop
      });
    }
  }, [onResults, drawScene]);

  // --- 3. RECORDING LOGIC (Photo & Video) ---
  
  // A. Take Photo
  const takePhoto = async () => {
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      await uploadToFirebase(blob, 'image');
    }, 'image/jpeg', 0.9);
  };

  // B. Start Video
  const startRecording = () => {
    setIsRecording(true);
    chunksRef.current = [];
    const canvas = canvasRef.current;
    // Capture stream at 30 FPS
    const stream = canvas.captureStream(30); 
    
    // Check supported types
    const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') 
      ? 'video/webm; codecs=vp9' 
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
  };

  // C. Stop Video
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingProgress(0);

      // Wait a tiny bit for the last chunk
      setTimeout(() => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        uploadToFirebase(blob, 'video');
      }, 500);
    }
  };

  // --- 4. UPLOAD LOGIC ---
  const uploadToFirebase = async (fileBlob, type) => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      const ext = type === 'video' ? 'webm' : 'jpg';
      const fileName = `${uuidv4()}.${ext}`;
      const storageRef = ref(storage, `stories/${currentUser.uid}/${fileName}`);
      
      // Upload Blob
      await uploadBytes(storageRef, fileBlob);
      const downloadURL = await getDownloadURL(storageRef);

      // Save to Firestore
      await addDoc(collection(db, 'stories'), {
        uid: currentUser.uid,
        username: currentUser.displayName || 'User',
        avatar: currentUser.photoURL || '',
        media: downloadURL,
        type: type, // 'image' or 'video'
        duration: type === 'video' ? 5000 : 5000, // You could calculate real video duration
        timestamp: serverTimestamp(),
        isPopular: false
      });

      onClose();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- 5. INTERACTION HANDLERS (Hold vs Tap) ---
  const pressTimer = useRef(null);
  const startTime = useRef(null);

  const handlePointerDown = () => {
    if (!cameraReady || isUploading) return;
    
    startTime.current = Date.now();
    // If held for 300ms, consider it a video start
    pressTimer.current = setTimeout(() => {
      startRecording();
    }, 300);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    
    const duration = Date.now() - startTime.current;
    if (isRecording) {
      stopRecording();
    } else if (duration < 300) {
      takePhoto();
    }
  };

  // Video Progress Animation
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingProgress((prev) => {
          if (prev >= 100) {
            stopRecording();
            return 0;
          }
          return prev + 1; // Approx 10 seconds limit
        });
      }, 100); 
    }
    return () => clearInterval(interval);
  }, [isRecording]);


  // --- RENDER ---
  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col font-sans animate-in fade-in duration-300">
      
      {/* VIEWPORT AREA */}
      <div className="relative flex-1 overflow-hidden bg-gray-900 flex items-center justify-center">
        {/* Hidden Webcam (Source) */}
        <Webcam
          ref={webcamRef}
          audio={false}
          width={640}
          height={480}
          className="opacity-0 absolute pointer-events-none" 
          mirrored
        />
        
        {/* Main Canvas (Display + Recorder Source) */}
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={480} 
          className="absolute inset-0 w-full h-full object-cover" 
        />

        {/* Overlay UI */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex flex-col">
             <span className="text-white font-bold text-lg drop-shadow-md">Create Story</span>
             <span className="text-white/60 text-xs">Tap to snap, Hold to record</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Loading State */}
        {(isUploading || !cameraReady) && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-white font-bold text-lg">
              {!cameraReady ? "Starting Camera..." : "Sharing your story..."}
            </p>
          </div>
        )}
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-20 flex items-center gap-2 bg-red-600/80 px-4 py-1 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-white text-xs font-bold">RECORDING</span>
          </div>
        )}
      </div>

      {/* CONTROLS AREA */}
      <div className="bg-black/80 backdrop-blur-xl border-t border-white/10 pb-8 pt-6 px-4 z-20">
        
        {/* Filter Scroll */}
        <div className="mb-8 overflow-x-auto no-scrollbar pb-2">
           <div className="flex gap-4 justify-center min-w-max px-4">
             {FILTERS.map((filter) => (
               <button
                 key={filter.id}
                 onClick={() => setSelectedFilter(filter.id)}
                 className={`group flex flex-col items-center gap-2 transition-all duration-300 ${selectedFilter === filter.id ? '-translate-y-2' : 'opacity-60 hover:opacity-100'}`}
               >
                 <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-lg backdrop-blur-md
                    ${selectedFilter === filter.id 
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400 shadow-yellow-400/20' 
                      : 'border-white/30 bg-white/10 text-white'}
                 `}>
                   {filter.icon}
                 </div>
                 <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedFilter === filter.id ? 'text-yellow-400' : 'text-white'}`}>
                   {filter.name}
                 </span>
               </button>
             ))}
           </div>
        </div>

        {/* Action Button (Shutter) */}
        <div className="flex items-center justify-center relative">
          {/* Progress Ring for Video */}
          <svg className="w-24 h-24 absolute -rotate-90 pointer-events-none">
            <circle
              cx="48" cy="48" r="46"
              stroke="white" strokeWidth="4"
              fill="transparent"
              className="opacity-20"
            />
            {isRecording && (
              <circle
                cx="48" cy="48" r="46"
                stroke="#ef4444" strokeWidth="4"
                fill="transparent"
                strokeDasharray="289" // 2 * PI * 46
                strokeDashoffset={289 - (289 * recordingProgress) / 100}
                className="transition-all duration-100 linear"
              />
            )}
          </svg>

          {/* Actual Button */}
          <button
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchEnd={handlePointerUp}
            className={`
              w-20 h-20 rounded-full border-4 transition-all duration-200 z-10
              flex items-center justify-center shadow-2xl
              ${isRecording 
                ? 'bg-red-500 border-red-200 scale-90' 
                : 'bg-white border-gray-200 hover:scale-105 active:scale-95'}
            `}
          >
            {isRecording ? (
               <div className="w-8 h-8 bg-white rounded-sm" /> // Stop Icon
            ) : (
               <div className="w-16 h-16 rounded-full border-2 border-gray-300" /> // Inner ring
            )}
          </button>
        </div>
      </div>
    </div>
  );
}