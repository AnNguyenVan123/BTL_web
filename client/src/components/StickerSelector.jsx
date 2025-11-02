const StickerSelector = ({ addSticker }) => {
  const stickers = [
    "https://i.ibb.co/2s0XK1v/glasses.png",
    "https://i.ibb.co/3yXkqfK/crown.png",
    "https://i.ibb.co/JrCzq1H/mustache.png"
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {stickers.map((src, i) => (
        <img
          key={i}
          src={src}
          alt="sticker"
          width={50}
          style={{
            cursor: "pointer",
            borderRadius: "8px",
            border: "1px solid transparent",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.border = "1px solid #007bff"}
          onMouseLeave={e => e.currentTarget.style.border = "1px solid transparent"}
          onClick={() => addSticker({ src, x: 200, y: 100, width: 100, height: 100 })}
        />
      ))}
    </div>
  );
};

export default StickerSelector;
