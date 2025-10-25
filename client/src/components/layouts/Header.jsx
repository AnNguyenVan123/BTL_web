import "../../styles/layout.css";
import {
  SearchOutlined,
  PlayCircleOutlined,
  FireOutlined,
  MessageOutlined,
  VideoCameraAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown } from "antd";

import { Logo } from "./Logo";

export default function Header() {
  const items = [
    {
      key: "1",
      label: "My Account",
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "2",
      label: "Profile",
      extra: "⌘P",
    },
    {
      key: "3",
      label: "Change Password",
      extra: "⌘CP",
    },
  ];

  const onClick = ({ key }) => {
    console.log(key);
  };
  return (
    <header className="pt-6 pb-2 grid grid-cols-3">
      <div className="flex items-center">
        <div>
          <a
            href="/"
            className="inline-block px-4 py-4 mx-3 rounded-md hover:bg-[#fffc00]"
          >
            <Logo width={24} height={24} />
          </a>
        </div>
        <div className="relative">
          <span className="absolute mt-2 ml-2">
            <SearchOutlined style={{ fontSize: "24px" }} />
          </span>
          <input type="text" placeholder="Search" id="header-search" />
        </div>
      </div>
      <div
        id="header-features"
        className="flex gap-8 max-w-[384px] place-self-center cursor-pointer"
      >
        <div className="flex flex-col items-center">
          <PlayCircleOutlined style={{ fontSize: "28px" }} />
          <p>Stories</p>
        </div>
        <div className="flex flex-col items-center">
          <FireOutlined style={{ fontSize: "28px" }} />
          <p>Spotlight</p>
        </div>
        <div className="flex flex-col items-center">
          <MessageOutlined style={{ fontSize: "28px" }} />
          <p>Chat</p>
        </div>
        <div className="flex flex-col items-center">
          <VideoCameraAddOutlined style={{ fontSize: "28px" }} />
          <p>Lenses</p>
        </div>
      </div>
      <div className="place-self-end self-center pr-10">
        <Dropdown menu={{ items, onClick }}>
          <a href="" onClick={(e) => e.preventDefault()}>
            <Avatar size="large" icon={<UserOutlined />} />
          </a>
        </Dropdown>
      </div>
    </header>
  );
}
