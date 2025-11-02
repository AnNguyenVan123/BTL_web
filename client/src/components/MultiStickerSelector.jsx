import React from "react";
import glasses from "../assets/glasses.png";
import crown from "../assets/crown.png";
import mustache from "../assets/mustache.png";

const MultiStickerSelector = ({ stickers, setStickers }) => {
  const availableStickers = [
    { name: "Glasses", src: glasses },
    { name: "Crown", src: crown },
    { name: "Mustache", src: mustache },
  ];

  const toggleSticker = (sticker) => {
    const exists = stickers.find((s) => s.src === sticker.src);
    if (exists) {
      setStickers(stickers.filter((s) => s.src !== sticker.src));
    } else {
      setStickers([...stickers, { ...sticker }]);
    }
  };

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {availableStickers.map((s) => (
        <img
          key={s.name}
          src={s.src}
          alt={s.name}
          width={50}
          style={{ cursor: "pointer", border: stickers.find((st) => st.src === s.src) ? "2px solid blue" : "none" }}
          onClick={() => toggleSticker(s)}
        />
      ))}
    </div>
  );
};

export default MultiStickerSelector;
