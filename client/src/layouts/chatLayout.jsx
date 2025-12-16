import "./chat.css";

import { useState } from "react";
import { Outlet } from "react-router-dom";

import { ChatContext } from "../context/ChatContext";

import SideBar from "../components/pages/chat/sidebar/SideBar";
import NewChatPanel from "../components/pages/chat/sidebar/NewChatPanel";

export default function ChatLayout() {
  const [close, setClose] = useState(true);
  const [toggleAddUser, setToggleAddUser] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  return (
    <ChatContext.Provider
      value={{
        close,
        setClose,
        toggleAddUser,
        setToggleAddUser,
        selectedChatId,
        setSelectedChatId,
        receiver,
        setReceiver,
        showNewChat,
        setShowNewChat,
      }}
    >
      <div className="h-screen grid grid-cols-[340px_1fr]">
        <SideBar />
        {showNewChat && (
          <div className="absolute top-0 bottom-0 left-[340px] z-50 h-full shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
            <NewChatPanel />
          </div>
        )}
        {close ? (
          <div className="flex justify-center items-center h-screen">
            <img src="/bg.webp" className="chat-bg" />
            <Outlet />
          </div>
        ) : (
          <div className="h-full">
            <Outlet />
          </div>
        )}
      </div>
    </ChatContext.Provider>
  );
}
