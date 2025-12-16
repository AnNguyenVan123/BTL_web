import {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import Webcam from "react-webcam";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const ARView = forwardRef(({ isFrontCamera, zoom, filter, isActive }, ref) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const latestLandmarksRef = useRef(null);

  const videoConstraints = {
    width: 720,
    height: 1280,
    facingMode: isFrontCamera ? "user" : "environment",
  };

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;

    if (canvas && video && video.readyState === 4) {
      const ctx = canvas.getContext("2d");
      const { width, height } = canvas;

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      if (isFrontCamera) {
        ctx.scale(-1, 1);
        ctx.drawImage(video, -width, 0, width, height);
      } else {
        ctx.drawImage(video, 0, 0, width, height);
      }
      ctx.restore();

      if (latestLandmarksRef.current) {
        const landmarks = latestLandmarksRef.current;
        drawFilter(ctx, landmarks, filter, width, height, isFrontCamera);
      }
    }

    if (isActive) requestAnimationFrame(drawScene);
  }, [filter, isFrontCamera, isActive]);

  const drawFilter = (ctx, landmarks, type, width, height, isFront) => {
    if (type === "none") return;

    // Helper tính tọa độ X (đã xử lý lật hình)
    const getX = (val) => (isFront ? (1 - val) * width : val * width);
    const getY = (val) => val * height;

    if (type === "mesh") {
      ctx.fillStyle = "#00FF00";
      landmarks.forEach((pt) => ctx.fillRect(getX(pt.x), getY(pt.y), 2, 2));
    } else if (type === "clown") {
      const nose = landmarks[1];
      ctx.beginPath();
      ctx.arc(getX(nose.x), getY(nose.y), 30, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
      ctx.fill();
    }
    // ... Thêm các filter khác tương tự
  };

  useEffect(() => {
    if (!isActive) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks?.length > 0) {
        latestLandmarksRef.current = results.multiFaceLandmarks[0];
      } else {
        latestLandmarksRef.current = null;
      }
    });

    let camera;
    if (webcamRef.current && webcamRef.current.video) {
      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video) {
            await faceMesh.send({ image: webcamRef.current.video });
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();
      requestAnimationFrame(drawScene);
    }

    return () => {
      if (camera) camera.stop();
      faceMesh.close();
    };
  }, [isActive, drawScene]);

  useImperativeHandle(ref, () => ({
    capture: () => {
      if (canvasRef.current) {
        return canvasRef.current.toDataURL("image/png");
      }
      return null;
    },
  }));

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 w-full h-full bg-black rounded-[20px] overflow-hidden">
      <Webcam
        ref={webcamRef}
        audio={false}
        width={720}
        height={1280}
        videoConstraints={videoConstraints}
        className="hidden"
      />

      <canvas
        ref={canvasRef}
        width={720}
        height={1280}
        className="w-full h-full object-cover"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          transition: "transform 0.1s linear",
        }}
      />
    </div>
  );
});

export default ARView;
