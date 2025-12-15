import "./chat.css";

import { useContext, useEffect, useState, useRef } from "react";
import { ChatContext } from "../context/ChatContext";
import EmojiPicker from "emoji-picker-react";
import {
  CameraFilled,
  SmileOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { Input, Image } from "antd";

import { storage, db } from "../lib/firebase";
import {
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

import Header from "../components/pages/chat/main/Header";
import AddUser from "../components/pages/chat/sidebar/AddUser";
import CameraModal from "../components/pages/chat/main/CameraModal";
import SnapViewer from "../components/pages/chat/main/SnapViewer";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { close, setClose, selectedChatId, receiver } = useContext(ChatContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [viewingSnap, setViewingSnap] = useState(null);
  const inputRef = useRef(null);

  const { user } = useAuth();

  // Hàm khi bấm vào nút "Tap to view"
  const handleOpenSnap = (message) => {
    if (message.isViewed) return;
    setViewingSnap(message);
  };

  // Hàm khi đóng Modal -> THỰC HIỆN XÓA ẢNH
  const handleCloseSnap = async () => {
    if (!viewingSnap) return;

    const messageToBurn = viewingSnap;

    setViewingSnap(null);

    try {
      const chatRef = doc(db, "chats", selectedChatId);
      const chatSnap = await getDoc(chatRef);

      if (chatSnap.exists()) {
        const data = chatSnap.data();

        const updatedMessages = data.messages.map((msg) => {
          if (msg.id === messageToBurn.id) {
            return { ...msg, isViewed: true, img: null };
          }
          return msg;
        });
        await updateDoc(chatRef, {
          messages: updatedMessages,
        });
        console.log("Đã đốt ảnh thành công!");
      }
    } catch (err) {
      console.error("Lỗi khi đốt ảnh:", err);
    }
  };

  const handleSendImage = async (imageBase64) => {
    try {
      console.log("Đang upload ảnh...");

      // Tạo tên file unique
      const imageId = uuidv4();
      const storageRef = ref(storage, `snaps/${imageId}.png`);

      // Upload Base64 lên Firebase Storage
      await uploadString(storageRef, imageBase64, "data_url");

      // Lấy URL tải xuống
      const downloadURL = await getDownloadURL(storageRef);

      // Tạo object tin nhắn
      const messageId = uuidv4();
      const newMessage = {
        id: messageId,
        senderId: user.uid,
        text: "Sent a Snap",
        img: downloadURL,
        type: "snap",
        isViewed: false,
        createdAt: new Date(),
      };

      // 5. Update vào Firestore (chat room)
      await updateDoc(doc(db, "chats", selectedChatId), {
        messages: arrayUnion(newMessage),
      });

      // 6. Update Last Message cho UserChats (Sidebar)
      const userIds = [user.uid, receiver.uid];
      userIds.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === selectedChatId
          );

          userChatsData.chats[chatIndex].lastMessage = "📷 Sent a photo";
          userChatsData.chats[chatIndex].isSeen = id === user.uid;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      });

      console.log("Đã gửi Snap thành công!");
    } catch (error) {
      console.error("Lỗi gửi ảnh:", error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleSend = async () => {
    if (!text || !text.trim()) return;
    console.log("Send message:", text);
    inputRef.current.input.value = "";
    setText("");
    setShowEmojiPicker(false);
    try {
      await updateDoc(doc(db, "chats", selectedChatId), {
        messages: arrayUnion({
          senderId: user.uid,
          text,
          createdAt: new Date(),
        }),
      });

      const userIds = [user.uid, receiver.uid];

      userIds.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === selectedChatId
          );

          userChatsData.chats[chatIndex].lastMessage = text;
          userChatsData.chats[chatIndex].isSeen =
            id === user.uid ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!selectedChatId) return;

    const chatDocRef = doc(db, "chats", selectedChatId);
    const unSub = onSnapshot(chatDocRef, (docSnap) => {
      if (!docSnap.exists()) {
        setMessages([]);
        return;
      }
      const data = docSnap.data();
      setMessages(data.messages || []);
    });

    return () => unSub();
  }, [selectedChatId]);

  return (
    <>
      {close ? (
        <div className="h-screen flex items-center justify-center relative w-full">
          <div className="blur-container"></div>
          <AddUser />
        </div>
      ) : (
        <div className="h-screen relative">
          <AddUser />
          <div className="p-2 bg-[#121212] h-full flex flex-col">
            <Header setClose={setClose} receiver={receiver} />
            <div className="p-3 border-gray-700 rounded-2xl bg-[#1E1E1E] h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {!selectedChatId ? (
                  <div className="text-center text-gray-400 mt-8">
                    Select a chat to start messaging
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 p-2">
                    {messages.length === 0 ? (
                      <div className="text-gray-400">No messages yet</div>
                    ) : (
                      messages.map((m, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded ${
                            m.senderId === user.uid
                              ? "bg-blue-600 text-white self-end"
                              : "bg-gray-700 text-white self-start"
                          }`}
                        >
                          {m.type === "snap" ? (
                            <div className="flex flex-col gap-1">
                              {m.isViewed ? (
                                <div
                                  className={`flex items-center gap-2 px-3 py-2 rounded border ${
                                    m.senderId === user.uid
                                      ? "border-blue-500/30 bg-blue-900/20"
                                      : "border-gray-600 bg-gray-800"
                                  }`}
                                >
                                  <span className="text-lg">🔥</span>
                                  <span className="text-gray-400 text-sm italic">
                                    {m.senderId === user.uid
                                      ? "Opened"
                                      : "Expired"}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  {m.senderId === user.uid ? (
                                    <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/50">
                                      <Image
                                        width={150}
                                        src={m.img}
                                        className="rounded-lg object-cover"
                                        alt="My Snap"
                                      />
                                      <div className="text-right text-[10px] text-blue-300 mt-1 font-bold uppercase tracking-wider">
                                        Snap Delivered
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => handleOpenSnap(m)}
                                      className="cursor-pointer font-bold py-2 px-4 rounded transition-all flex items-center gap-2 shadow-lg bg-linear-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white animate-pulse"
                                    >
                                      <span>📸</span>
                                      <span>Tap to View Snap</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm">{m.text}</div>
                          )}
                          <div className="text-xs text-gray-300 mt-1">
                            {m.createdAt?.toDate?.().toLocaleString?.() || ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-[1fr_20fr_1fr_1fr] place-content-center gap-3 mt-4 relative">
                {showEmojiPicker && (
                  <div className="absolute bottom-12 right-0 z-50 shadow-lg">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme="dark"
                      width={400}
                      height={400}
                    />
                  </div>
                )}
                <div
                  className="w-9 h-9 border border-gray-700 rounded-full grid place-content-center bg-[#292929] cursor-pointer"
                  onClick={() => setIsCameraOpen(true)}
                >
                  <CameraFilled style={{ color: "#7E7E7E", fontSize: 18 }} />
                </div>

                <div id="custom-input">
                  <Input
                    className="input"
                    placeholder="Send a chat"
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onPressEnter={handleSend}
                  />
                </div>

                <div
                  className="w-9 h-9 border border-gray-700 rounded-full grid place-content-center bg-[#292929] cursor-pointer"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                >
                  <SmileOutlined style={{ color: "#7E7E7E", fontSize: 18 }} />
                </div>

                <div className="w-9 h-9 border border-gray-700 rounded-full grid place-content-center bg-[#292929]">
                  <FileImageOutlined
                    style={{ color: "#7E7E7E", fontSize: 18 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {viewingSnap && (
        <SnapViewer imageSrc={viewingSnap.img} onClose={handleCloseSnap} />
      )}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onSendImage={handleSendImage}
      />
    </>
  );
}
