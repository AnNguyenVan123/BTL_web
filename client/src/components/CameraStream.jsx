import React, { useEffect } from "react";

const CameraStream = ({ videoRef }) => {
  useEffect(() => {
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 640, height: 480 } }) // Request specific resolution
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // No need to call videoRef.current.play() since autoPlay is used
          }
        })
        .catch((err) => console.error("Error accessing camera: ", err));
    }

    // Cleanup function to stop the video stream when the component unmounts
    return () => {
        const stream = videoRef.current?.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [videoRef]);

  // The video element is hidden (display: "none"), but crucial for feeding frames to Mediapipe.
  return (
    <video 
      ref={videoRef} 
      autoPlay 
      playsInline 
      className="hidden" // Tailwind for display: none
      width="640" // Explicit dimensions for the stream
      height="480"
    ></video>
  );
};

export default CameraStream;