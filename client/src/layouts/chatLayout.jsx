import "./chat.css";

import { useState } from "react";
import { Outlet } from "react-router-dom";

import { ChatContext } from "../context/ChatContext";

import SideBar from "../components/pages/chat/sidebar/SideBar";

export default function ChatLayout() {
  const [close, setClose] = useState(true);
  return (
    <ChatContext.Provider value={{ close, setClose }}>
      <div className="h-screen grid grid-cols-[340px_1fr]">
        <SideBar />
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
