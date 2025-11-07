import "./chat.css";

import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";

import {
  CameraFilled,
  SmileOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { Input } from "antd";

import Header from "../components/pages/chat/main/Header";

export default function Chat() {
  const { close, setClose } = useContext(ChatContext);
  return (
    <>
      {close ? (
        <div className="h-screen flex items-center justify-center">
          <div className="blur-container"></div>
        </div>
      ) : (
        <div className="p-2 bg-[#121212] h-full flex flex-col">
          <Header setClose={setClose} />
          <div className="p-3 border-gray-700 rounded-2xl bg-[#1E1E1E] h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">{/* messages */}</div>

            <div className="grid grid-cols-[1fr_20fr_1fr_1fr] place-content-center gap-3 mt-4">
              <div className="w-9 h-9 border border-gray-700 rounded-full grid place-content-center bg-[#292929]">
                <CameraFilled style={{ color: "#7E7E7E", fontSize: 18 }} />
              </div>

              <div id="custom-input">
                <Input className="input" placeholder="Send a chat" />
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
