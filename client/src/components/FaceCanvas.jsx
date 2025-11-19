import React, { useEffect, useRef, useState } from "react";

const FaceStickerCanvas = ({ videoRef, stickerSrc }) => {
  const canvasRef = useRef(null);
  const sticker = useRef(null);

  useEffect(() => {
    sticker.current = new Image();
    sticker.current.src = stickerSrc;
  }, [stickerSrc]);

  useEffect(() => {
    // Load OpenCV.js từ CDN
    const script = document.createElement("script");
    script.src = "https://docs.opencv.org/4.x/opencv.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // chờ cv ready
      cv['onRuntimeInitialized'] = () => {
        console.log("OpenCV.js ready");

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Load Haar cascade
        const faceCascadeFile = "haarcascade_frontalface_default.xml";
        fetch(faceCascadeFile)
          .then(res => res.arrayBuffer())
          .then(data => {
            cv.FS_createDataFile("/", faceCascadeFile, new Uint8Array(data), true, false, false);
            const faceCascade = new cv.CascadeClassifier();
            faceCascade.load(faceCascadeFile);

            const srcMat = new cv.Mat(videoRef.current.height, videoRef.current.width, cv.CV_8UC4);
            const grayMat = new cv.Mat();
            const faces = new cv.RectVector();

            const processFrame = () => {
              if (!videoRef.current) return;
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

              let frame = cv.imread(canvas);
              cv.cvtColor(frame, grayMat, cv.COLOR_RGBA2GRAY, 0);
              faceCascade.detectMultiScale(grayMat, faces, 1.1, 3, 0);

              for (let i = 0; i < faces.size(); i++) {
                const face = faces.get(i);
                const { x, y, width, height } = face;
                if (sticker.current.complete) {
                  ctx.drawImage(sticker.current, x, y - height * 0.3, width, height);
                }
              }

              frame.delete();
              requestAnimationFrame(processFrame);
            };

            processFrame();
          });
      };
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [videoRef, stickerSrc]);

  return <canvas ref={canvasRef} width={640} height={480} style={{ borderRadius: 12 }} />;
};

export default FaceStickerCanvas;

