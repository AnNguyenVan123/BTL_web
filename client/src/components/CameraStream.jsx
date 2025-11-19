import React, { useEffect } from "react";

const CameraStream = ({ videoRef }) => {
  useEffect(() => {
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch((err) => console.error("Error accessing camera: ", err));
    }
  }, [videoRef]);

  return <video ref={videoRef} autoPlay playsInline width={640} height={480} style={{ borderRadius: 12 }} />;
};

export default CameraStream;
