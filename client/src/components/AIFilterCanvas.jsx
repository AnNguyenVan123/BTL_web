import React, { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const AIFilterCanvas = ({ videoRef, filter, stickers }) => {
  const canvasRef = useRef(null);
  const stickerImages = useRef({});
  const particles = useRef([]);

  useEffect(() => {
    // Load sticker images
    stickers.forEach((s) => {
      if (!stickerImages.current[s.src]) {
        const img = new Image();
        img.src = s.src;
        stickerImages.current[s.src] = img;
      }
    });
  }, [stickers]);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Init particle array
    particles.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 3 + Math.random() * 5,
      speedY: 1 + Math.random(),
      color: `hsl(${Math.random() * 360}, 100%, 60%)`,
    }));

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 2,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw video with filter
      ctx.filter = filter;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = "none";

      if (results.multiFaceLandmarks) {
        results.multiFaceLandmarks.forEach((landmarks) => {
          // Example: Eye warp + sticker overlay
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          const eyeWidth = (rightEye.x - leftEye.x) * canvas.width * 1.5;
          const eyeHeight = eyeWidth / 2;
          const eyeX = leftEye.x * canvas.width - eyeWidth / 4;
          const eyeY = leftEye.y * canvas.height - eyeHeight / 2;

          stickers.forEach((st) => {
            const img = stickerImages.current[st.src];
            if (img && img.complete) {
              ctx.drawImage(img, eyeX, eyeY, eyeWidth, eyeHeight);
            }
          });

          // Particle effect on nose tip
          const nose = landmarks[1];
          particles.current.forEach((p) => {
            p.y -= p.speedY;
            if (p.y < 0) p.y = nose.y * canvas.height;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(nose.x * canvas.width + p.x % 50, p.y, p.size, 0, 2 * Math.PI);
            ctx.fill();
          });
        });
      }
    });

    const camera = new Camera(video, {
      onFrame: async () => await faceMesh.send({ image: video }),
      width: 640,
      height: 480,
    });

    camera.start();
  }, [videoRef, filter, stickers]);

  return <canvas ref={canvasRef} width={640} height={480} style={{ borderRadius: 12, marginTop: 10 }} />;
};

export default AIFilterCanvas;
