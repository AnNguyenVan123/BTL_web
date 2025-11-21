import {
  UserOutlined,
  UserAddOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Avatar } from "antd";
import { Logo } from "../../../layouts/Logo";

export default function Header() {
  return (
    <>
      <div className="flex justify-around items-center max-h-[61px] h-1/6 border border-b-gray-700">
        <Avatar size="large" icon={<UserOutlined />} />
        <Logo width={36} height={36} />
        <div className="flex gap-2">
          <div className="rounded-full bg-[#424242] w-8 h-8 grid place-content-center">
            <UserAddOutlined style={{ color: "white", fontSize: 18 }} />
          </div>
          <div className="rounded-full bg-[#0FADFF] w-8 h-8 grid place-content-center">
            <MessageOutlined style={{ color: "white", fontSize: 18 }} />
          </div>
        </div>
      </div>
    </>
  );
}
