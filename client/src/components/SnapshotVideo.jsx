import React, { useRef, useState } from "react";

const SnapshotVideo = ({ canvasRef }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);

  const takeSnapshot = () => {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "snap.png";
    link.click();
  };

  const startRecording = () => {
    if (!canvasRef.current) return;
    recordedChunks.current = [];
    const stream = canvasRef.current.captureStream(30); // 30fps
    mediaRecorder.current = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "video.webm";
      a.click();
    };
    mediaRecorder.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder.current) mediaRecorder.current.stop();
    setRecording(false);
  };

  return (
    <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
      <button onClick={takeSnapshot}>Snapshot</button>
      {!recording && <button onClick={startRecording}>Start Video</button>}
      {recording && <button onClick={stopRecording}>Stop Video</button>}
    </div>
  );
};

export default SnapshotVideo;
