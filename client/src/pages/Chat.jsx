import "./chat.css";

import { useContext, useEffect, useState, useRef } from "react";
import { ChatContext } from "../context/ChatContext";

import {
  CameraFilled,
  SmileOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { Input } from "antd";

import { db } from "../lib/firebase";
import {
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";

import Header from "../components/pages/chat/main/Header";
import AddUser from "../components/pages/chat/sidebar/AddUser";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { close, setClose, selectedChatId, receiver } = useContext(ChatContext);
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);

  const { user } = useAuth();

  const handleSend = async () => {
    const text = inputRef.current?.input?.value;
    if (!text || !text.trim()) return;
    console.log("Send message:", text);
    inputRef.current.input.value = "";
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
                        <div className="text-sm">{m.text}</div>
                        <div className="text-xs text-gray-300 mt-1">
                          {m.createdAt?.toDate?.().toLocaleString?.() || ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-[1fr_20fr_1fr_1fr] place-content-center gap-3 mt-4">
              <div className="w-9 h-9 border border-gray-700 rounded-full grid place-content-center bg-[#292929]">
                <CameraFilled style={{ color: "#7E7E7E", fontSize: 18 }} />
              </div>

              <div id="custom-input">
                <Input
                  className="input"
                  placeholder="Send a chat"
                  ref={inputRef}
                  onPressEnter={handleSend}
                />
              </div>

              <div className="w-9 h-9 border border-gray-700 rounded-full grid place-content-center bg-[#292929]">
                <SmileOutlined style={{ color: "#7E7E7E", fontSize: 18 }} />
              </div>

              <div className="w-9 h-9 border border-gray-700 rounded-full grid place-content-center bg-[#292929]">
                <FileImageOutlined style={{ color: "#7E7E7E", fontSize: 18 }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
