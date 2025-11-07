import { LeftOutlined } from "@ant-design/icons";

import { Logo } from "../../../layouts/Logo";

export default function Header({ setClose }) {
  return (
    <div className="w-full flex p-3 gap-3 max-h-[61px] h-1/6">
      <button
        className="bg-[#292929] w-9 h-9 rounded-full hover:bg-[#424242]"
        onClick={() => setClose(true)}
      >
        <LeftOutlined style={{ color: "white" }} />
      </button>
      <div className="flex gap-3 items-center">
        <div className="w-9 h-9 rounded-full bg-amber-200 grid place-content-center">
          <Logo width={20} height={20} />
        </div>
        <p className="text-white font-semibold">Team Snapchat</p>
      </div>
    </div>
  );
}
