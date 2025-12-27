import React, { useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  CameraFilled,
  SmileOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { Input } from "antd";
import { storage } from "../../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export default function ChatInput({
  onSendMessage,
  onSendImageSuccess, // Callback khi đã có URL ảnh (từ file upload)
  onTyping,
  onFocus,
  openCamera,
}) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  // Xử lý gửi tin nhắn text
  const handleSend = () => {
    if (!text || !text.trim()) return;
    onSendMessage(text);
    setText("");
    setShowEmojiPicker(false);
  };

  // Xử lý khi gõ phím
  const handleInputChange = (e) => {
    setText(e.target.value);
    if (onTyping) onTyping();
  };

  // Xử lý chọn Emoji
  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // Xử lý Upload File từ máy
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      console.log("Đang upload file từ máy...");
      // Tạo tên file ngẫu nhiên
      const imageId = uuidv4();
      const storageRef = ref(storage, `snaps/${imageId}`);

      // Upload file raw (tốt hơn base64 cho file lớn)
      await uploadBytes(storageRef, file);

      // Lấy URL
      const downloadURL = await getDownloadURL(storageRef);

      console.log("Upload xong, gửi URL cho parent...");
      // Gửi URL ngược về Chat.js để bắn WebSocket
      onSendImageSuccess(downloadURL);
    } catch (error) {
      console.error("Lỗi upload file:", error);
    } finally {
      // Reset input để người dùng có thể chọn lại file đó nếu muốn
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };

  return (
    <div className="grid grid-cols-[0.9fr_12fr_0.9fr_0.9fr] sm:grid-cols-[1fr_16fr_1fr_1fr] md:grid-cols-[1fr_20fr_1fr_1fr] place-content-center gap-2 sm:gap-3 mt-4 relative shrink-0">
      {showEmojiPicker && (
        <div className="absolute bottom-12 right-0 z-50 shadow-lg w-[280px] max-w-[90vw]">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            width={280}
            height={320}
          />
        </div>
      )}

      {/* Nút mở Camera */}
      <div
        className="w-9 h-9 border border-gray-700 rounded-full grid place-content-center bg-[#292929] cursor-pointer hover:bg-[#3a3a3a] transition-colors"
        onClick={openCamera}
      >
        <CameraFilled style={{ color: "#7E7E7E", fontSize: 18 }} />
      </div>

      {/* Input nhập tin nhắn */}
      <div id="custom-input">
        <Input
          className="input"
          placeholder="Send a chat"
          value={text}
          onChange={handleInputChange}
          onPressEnter={handleSend}
          onFocus={onFocus}
        />
      </div>

      {/* Nút mở Emoji */}
      <div
        className="w-9 h-9 border border-gray-700 rounded-full grid place-content-center bg-[#292929] cursor-pointer hover:bg-[#3a3a3a] transition-colors"
        onClick={() => setShowEmojiPicker((prev) => !prev)}
      >
        <SmileOutlined style={{ color: "#7E7E7E", fontSize: 18 }} />
      </div>

      {/* Nút Upload Ảnh từ File */}
      <div
        className="w-9 h-9 border border-gray-700 rounded-full grid place-content-center bg-[#292929] cursor-pointer hover:bg-[#3a3a3a] transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <FileImageOutlined style={{ color: "#7E7E7E", fontSize: 18 }} />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: "none" }}
          accept="image/*"
        />
      </div>
    </div>
  );
}