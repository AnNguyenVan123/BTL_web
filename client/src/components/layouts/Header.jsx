import "../../styles/layout.css";
import {
  SearchOutlined,
  PlayCircleOutlined,
  FireOutlined,
  MessageOutlined,
  VideoCameraAddOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Button } from "antd";
import { Logo } from "./Logo";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Header() {
  const { user, logout } = useAuth();

  // Nếu có user → tạo menu đầy đủ
  const items = user
    ? [
        {
          key: "profile",
          label: (
            <div className="flex items-center gap-3 px-2 py-1">
              <Avatar
                size="small"
                src={user.photoURL}
                icon={<UserOutlined />}
              />
              <div>
                <p className="font-semibold">
                  {user.displayName || user.email}
                </p>
                <p className="text-xs text-gray-500">My Account</p>
              </div>
            </div>
          ),
          disabled: true,
        },
        { type: "divider" },
        {
          key: "profile-link",
          icon: <ProfileOutlined />,
          label: <Link to="/profile">View Profile</Link>,
        },
        {
          key: "settings",
          icon: <SettingOutlined />,
          label: <Link to="/settings">Settings</Link>,
        },
        { type: "divider" },
        {
          key: "logout",
          icon: <LogoutOutlined />,
          label: "Log out",
          danger: true,
        },
      ]
    : [
        {
          key: "login",
          label: <Link to="/login">Log in</Link>,
        },
      ];

  const onClick = async ({ key }) => {
    if (key === "logout") {
      await logout();
    }
  };

  return (
    <header className="pt-6 pb-2 grid grid-cols-3">
      {/* Logo + Search */}
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
          <input
            type="text"
            placeholder="Search"
            id="header-search"
            className="pl-10 pr-4 py-2 border rounded-md focus:outline-none"
          />
        </div>
      </div>

      {/* Middle features */}
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
        <Link to={"/chat"}>
          <div className="flex flex-col items-center">
            <MessageOutlined style={{ fontSize: "28px" }} />
            <p>Chat</p>
          </div>
        </Link>
        <div className="flex flex-col items-center">
          <VideoCameraAddOutlined style={{ fontSize: "28px" }} />
          <p>Lenses</p>
        </div>
      </div>

      {/* User section */}
      <div className="place-self-end self-center pr-10">
        {user ? (
          <Dropdown menu={{ items, onClick }} trigger={["click"]}>
            <a href="#" onClick={(e) => e.preventDefault()}>
              <div className="flex items-center gap-2">
                <Avatar
                  size="large"
                  src={user.photoURL}
                  icon={<UserOutlined />}
                />
                <span className="font-medium">
                  {user.displayName || user.email}
                </span>
              </div>
            </a>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            href="/login"
            className="bg-yellow-400 text-black font-semibold rounded-lg px-5 py-2 hover:bg-yellow-300"
          >
            Login
          </Button>
        )}
      </div>
    </header>
  );
}
