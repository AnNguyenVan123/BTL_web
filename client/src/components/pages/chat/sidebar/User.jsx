import { useContext } from "react";
import { ChatContext } from "../../../../context/ChatContext";

import { Logo } from "../../../layouts/Logo";
import { CameraOutlined } from "@ant-design/icons";

export default function UserChat() {
  const { setClose } = useContext(ChatContext);
  return (
    <div
      className="flex justify-between bg-[#272727] p-4 rounded-lg hover:cursor-pointer"
      onClick={() => setClose(false)}
    >
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-200">
          <Logo width={29} height={29} />
        </div>
        <div className="text-white">
          <p className="text-base">Team Snapchat</p>
          <div className="text-xs flex gap-2">
            <p>Received</p>
            <p>.</p>
            <p>Oct 26</p>
          </div>
        </div>
      </div>
      <div className="grid place-content-cener">
        <CameraOutlined style={{ color: "white", fontSize: 20 }} />
      </div>
    </div>
  );
}
