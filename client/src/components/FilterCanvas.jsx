import React, { useEffect } from "react";

const FilterCanvas = ({ videoRef, canvasRef, filter, stickers }) => {
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    const draw = () => {
      if (videoRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.filter = filter;
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        // Vẽ sticker overlay
        stickers.forEach(sticker => {
          const img = new Image();
          img.src = sticker.src;
          ctx.drawImage(img, sticker.x, sticker.y, sticker.width, sticker.height);
        });
      }
      requestAnimationFrame(draw);
    };
    draw();
  }, [videoRef, canvasRef, filter, stickers]);

  return <canvas ref={canvasRef} width={640} height={480} />;
};

export default FilterCanvas;
