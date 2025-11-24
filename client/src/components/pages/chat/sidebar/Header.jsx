import { useContext } from "react";

import {
  UserOutlined,
  UserAddOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Avatar } from "antd";
import { Logo } from "../../../layouts/Logo";

import { ChatContext } from "../../../../context/ChatContext";

export default function Header() {
  const { toggleAddUser, setToggleAddUser } = useContext(ChatContext);
  return (
    <>
      <div className="flex justify-around items-center max-h-[61px] h-1/6 border border-b-gray-700">
        <Avatar size="large" icon={<UserOutlined />} />
        <Logo width={36} height={36} />
        <div className="flex gap-2">
          <div
            className="rounded-full bg-[#424242] w-8 h-8 grid place-content-center cursor-pointer"
            onClick={() => setToggleAddUser(!toggleAddUser)}
          >
            <UserAddOutlined style={{ color: "white", fontSize: 18 }} />
          </div>
          <div className="rounded-full bg-[#0FADFF] w-8 h-8 grid place-content-center cursor-pointer">
            <MessageOutlined style={{ color: "white", fontSize: 18 }} />
          </div>
        </div>
      </div>
    </>
  );
}
