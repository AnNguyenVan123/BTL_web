import React from "react";

const SnapshotButton = ({ canvasRef }) => {
  const handleSnapshot = () => {
    const link = document.createElement("a");
    link.download = "snapshot.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return <button onClick={handleSnapshot}>Chụp ảnh</button>;
};

export default SnapshotButton;
