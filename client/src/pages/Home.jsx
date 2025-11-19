import React, { useRef, useState } from "react";
import CameraStream from "../components/CameraStream";
import AIFilterCanvas from "../components/AIFilterCanvas";
import FilterSelector from "../components/FilterSelector";
import MultiStickerSelector from "../components/MultiStickerSelector";
import SnapshotVideo from "../components/SnapshotVideo";

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [filter, setFilter] = useState("none");
  const [stickers, setStickers] = useState([]);

  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: 20 }}>
      <h1>AI Snapchat Web Prototype (Full Feature)</h1>
      <CameraStream videoRef={videoRef} />
      <AIFilterCanvas videoRef={videoRef} filter={filter} stickers={stickers} ref={canvasRef} />
      <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
        <FilterSelector setFilter={setFilter} />
        <MultiStickerSelector stickers={stickers} setStickers={setStickers} />
      </div>
      <SnapshotVideo canvasRef={canvasRef} />
    </div>
  );
};

export default Home;



