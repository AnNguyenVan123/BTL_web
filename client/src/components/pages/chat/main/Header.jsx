import { useNavigate } from "react-router-dom";
import {
  LeftOutlined,
  PhoneFilled,
  VideoCameraFilled,
} from "@ant-design/icons";

import { rtdb } from "../../../../lib/firebase";
import { ref, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

import { useAuth } from "../../../../context/AuthContext";

export default function Header({ setClose, receiver }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hàm gọi điện
  const callUser = async (currentUser, targetUserId) => {
    // 1. Tạo Room ID mới
    const newRoomId = uuidv4();

    // 2. Chuẩn bị dữ liệu cuộc gọi
    const callPayload = {
      callerId: currentUser.uid,
      callerName: currentUser.displayName || "Anonymous",
      callerPhoto: currentUser.photoURL || "/default-avatar.png",
      roomId: newRoomId,
      timestamp: Date.now(),
    };

    // 3. Ghi vào nhánh incomingCall của NGƯỜI NHẬN (targetUserId)
    try {
      const targetRef = ref(rtdb, `users/${targetUserId}/incomingCall`);
      await set(targetRef, callPayload);

      // 4. Tự động chuyển người gọi vào phòng luôn để chờ
      navigate(`/video-chat?id=${newRoomId}`);
    } catch (error) {
      console.error("Không thể thực hiện cuộc gọi:", error);
      alert({
        title: "Lỗi",
        description: "Không thể kết nối tới người dùng này.",
      });
    }
  };
  return (
    <div className="w-full flex justify-between p-3 gap-3 max-h-[61px] h-1/6">
      <div className="flex gap-3">
        <button
          className="bg-[#292929] w-9 h-9 rounded-full hover:bg-[#424242]"
          onClick={() => setClose(true)}
        >
          <LeftOutlined style={{ color: "white" }} />
        </button>
        <div className="flex gap-3 items-center">
          <div className="w-9 h-9 rounded-full bg-amber-200 overflow-hidden">
            <img
              src={receiver?.photoURL || "/default-avatar.png"}
              alt="avatar"
              className="object-cover"
            />
          </div>
          <p className="text-white font-semibold">{receiver?.displayName}</p>
        </div>
      </div>
      <div className="bg-[#292929] flex gap-4 p-4 rounded-4xl text-white items-center">
        <p className="text-lg font-medium mr-3">Call</p>
        <PhoneFilled style={{ fontSize: 18, cursor: "pointer" }} />
        <VideoCameraFilled
          style={{ fontSize: 18, cursor: "pointer" }}
          title="Video Call"
          onClick={(e) => {
            e.stopPropagation();
            callUser(user, receiver.uid);
          }}
        />
      </div>
    </div>
  );
}
