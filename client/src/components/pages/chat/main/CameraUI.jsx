import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  doc,
  onSnapshot,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../lib/firebase";
import { useAuth } from "../../../../context/AuthContext";
import {
  SendOutlined,
  CheckCircleFilled,
  SearchOutlined,
  CloseOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { message } from "antd";

const CameraUI = () => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const [showSendList, setShowSendList] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const [searchText, setSearchText] = useState("");

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: isFrontCamera ? "user" : "environment",
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
        audio: false,
      };
      const currentStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(currentStream);
      if (videoRef.current) {
        videoRef.current.srcObject = currentStream;
      }
    } catch (err) {
      console.error("Lỗi mở camera:", err);
      alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (isFrontCamera) {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL("image/png");

      setCapturedImage(imageUrl);

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  // --- LOGIC XỬ LÝ CHỌN BẠN ---
  const handleToggleSelect = (friend) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.uid === friend.uid);
      if (isSelected) {
        return prev.filter((u) => u.uid !== friend.uid);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) return;
    setSending(true);

    try {
      console.log("Đang upload ảnh...");

      const imageId = uuidv4();
      const storageRef = ref(storage, `snaps/${imageId}.png`);

      await uploadString(storageRef, capturedImage, "data_url");

      const downloadURL = await getDownloadURL(storageRef);

      const sendPromises = selectedUsers.map(async (receiver) => {
        const selectedChatId = receiver.chatId;

        const messageId = uuidv4();
        const newMessage = {
          id: messageId,
          senderId: user.uid,
          text: "Sent a Snap",
          img: downloadURL,
          type: "snap",
          isViewed: false,
          createdAt: new Date(),
        };

        await updateDoc(doc(db, "chats", selectedChatId), {
          messages: arrayUnion(newMessage),
        });

        let recipientIds = [];
        if (receiver.isGroup) {
          // Nếu là group, update cho tất cả thành viên trong group đó (cần fetch members từ chat doc hoặc lưu sẵn)
          // Để đơn giản và nhanh, ta lấy members từ object receiver đã chuẩn bị ở useEffect
          recipientIds = receiver.members || [];
        } else {
          // Nếu là chat 1-1
          recipientIds = [user.uid, receiver.uid];
        }
        await Promise.all(
          recipientIds.map(async (id) => {
            const userChatsRef = doc(db, "userchats", id);
            const userChatsSnapshot = await getDoc(userChatsRef);

            if (userChatsSnapshot.exists()) {
              const userChatsData = userChatsSnapshot.data();
              const chatIndex = userChatsData.chats.findIndex(
                (c) => c.chatId === selectedChatId
              );

              if (chatIndex !== -1) {
                userChatsData.chats[chatIndex].lastMessage = "📷 Sent a snap";
                userChatsData.chats[chatIndex].isSeen = id === user.uid;
                userChatsData.chats[chatIndex].updatedAt = Date.now();

                await updateDoc(userChatsRef, {
                  chats: userChatsData.chats,
                });
              }
            }
          })
        );
      });

      await Promise.all(sendPromises);

      message.success("Sent Snap successfully! 🚀");

      setCapturedImage(null);
      setShowSendList(false);
      setSelectedUsers([]);
      setIsCameraActive(false);
    } catch (error) {
      console.error("Lỗi gửi ảnh:", error);
      message.error("Failed to send snap.");
    } finally {
      setSending(false);
    }
  };

  const filteredFriends = friends.filter((f) =>
    (f.displayName || "")
      .toLowerCase()
      .includes((searchText || "").toLowerCase())
  );

  useEffect(() => {
    if (isCameraActive && !capturedImage && !showSendList) {
      startCamera();
    }
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [isCameraActive, capturedImage, isFrontCamera, showSendList]);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, "userchats", user.uid), async (res) => {
      const data = res.data();
      const chatsArray = data.chats || [];

      if (chatsArray.length > 0) {
        const promises = chatsArray.map(async (chatItem) => {
          // CASE 1: GROUP CHAT -> Dùng luôn data có sẵn
          if (chatItem.type === "group") {
            try {
              const chatRoomSnap = await getDoc(
                doc(db, "chats", chatItem.chatId)
              );
              const chatRoomData = chatRoomSnap.exists()
                ? chatRoomSnap.data()
                : {};

              return {
                uid: chatItem.chatId,
                chatId: chatItem.chatId,
                displayName: chatItem.displayName || "Group",
                photoURL: chatItem.photoURL,
                isGroup: true,
                members: chatRoomData.members || [],
              };
            } catch (e) {
              return null;
            }
          }
          // CASE 2: SINGLE CHAT -> Fetch User Info
          else {
            try {
              const userDoc = await getDoc(
                doc(db, "users", chatItem.receiverId)
              );
              if (userDoc.exists()) {
                return {
                  uid: chatItem.receiverId,
                  chatId: chatItem.chatId,
                  ...userDoc.data(),
                  isGroup: false,
                };
              }
            } catch (e) {
              console.error("User fetch error", e);
            }
            return null;
          }
        });

        const resolvedFriends = await Promise.all(promises);
        // Lọc bỏ các item null
        setFriends(resolvedFriends.filter((f) => f !== null));
      }
    });

    return () => {
      unsub();
    };
  }, [user?.uid]);

  return (
    <div className="h-screen flex items-center justify-center relative w-full">
      <canvas ref={canvasRef} className="hidden"></canvas>

      <div className="blur-container relative overflow-hidden flex flex-col">
        {!isCameraActive && (
          <div className="w-full h-full flex flex-col items-center justify-center animate-fadeIn">
            <div
              className="flex flex-col items-center justify-center gap-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setIsCameraActive(true)}
            >
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-16 h-16 text-white"
                >
                  <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                  <path
                    fillRule="evenodd"
                    d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-center font-semibold text-white text-lg max-w-[200px] leading-snug drop-shadow-md select-none">
                Click the Camera to send Snaps
              </p>
            </div>
          </div>
        )}

        {isCameraActive && (
          <div className="w-full h-full relative">
            <div className="absolute inset-0 w-full h-full bg-black rounded-[20px] overflow-hidden">
              {!capturedImage ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    isFrontCamera ? "scale-x-[-1]" : ""
                  }`}
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="absolute bottom-0 w-full p-6 flex flex-col items-center justify-end bg-transparent-to-t from-black/50 to-transparent">
              {!capturedImage ? (
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10"></div>
                  <button
                    onClick={takePhoto}
                    className="w-20 h-20 rounded-full border-[6px] border-white/80 hover:bg-white/20 active:scale-95 transition-all"
                  ></button>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-200/80 flex items-center justify-center border border-white/30 cursor-pointer hover:scale-110 transition-transform">
                      😈
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-300/80 flex items-center justify-center border border-white/30 cursor-pointer hover:scale-110 transition-transform">
                      ✨
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={handleRetake}
                    className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-semibold border border-white/30 hover:bg-white/30"
                  >
                    Retake
                  </button>
                  <button
                    onClick={() => setShowSendList(true)}
                    className="px-6 py-3 bg-yellow-200 rounded-full font-bold hover:bg-yellow-500 shadow-lg flex items-center gap-2 transform active:scale-95 transition-all"
                  >
                    Send To <SendOutlined />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setIsCameraActive(false);
                setCapturedImage(null);
                if (stream) stream.getTracks().forEach((t) => t.stop());
              }}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 rounded-full w-8 h-8 backdrop-blur-md cursor-pointer"
            >
              ✕
            </button>

            {/* === MODAL "SEND TO" === */}
            {showSendList && (
              <div className="absolute inset-0 z-30 bg-[#121212] flex flex-col animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1a1a1a]">
                  <div className="flex items-center bg-[#2c2c2c] rounded-full px-4 py-2 flex-1 mr-4">
                    <SearchOutlined className="text-gray-400 mr-2" />
                    <input
                      type="text"
                      placeholder="Search friends..."
                      className="bg-transparent text-white outline-none w-full text-sm placeholder-gray-500"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setShowSendList(false)}
                    className="text-white p-2 rounded-full hover:bg-white/10"
                  >
                    <CloseOutlined />
                  </button>
                </div>

                {/* Friend List */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 px-2 mt-2">
                    Friends
                  </h3>

                  {filteredFriends.length === 0 ? (
                    <div className="text-center mt-10 text-gray-500">
                      <p>No friends found.</p>
                      <p className="text-xs">Go to "Add User" to connect.</p>
                    </div>
                  ) : (
                    filteredFriends.map((friend) => {
                      const isSelected = selectedUsers.some(
                        (u) => u.uid === friend.uid
                      );
                      return (
                        <div
                          key={friend.uid}
                          onClick={() => handleToggleSelect(friend)}
                          className={`flex items-center justify-between p-3 mb-1 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-500/20 border border-blue-500/50"
                              : "hover:bg-[#2c2c2c] border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={friend.photoURL || "/default-avatar.png"}
                              alt="avatar"
                              className="w-12 h-12 rounded-full object-cover bg-gray-700 shrink-0"
                            />
                            <div className="flex flex-col overflow-hidden">
                              <span
                                className={`font-semibold text-sm truncate ${
                                  isSelected ? "text-blue-400" : "text-white"
                                }`}
                              >
                                {friend.displayName}
                              </span>
                              <span className="text-xs text-gray-500 truncate">
                                Tap to send
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-500"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircleFilled className="text-white text-sm" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Send Button */}
                <div className="p-4 bg-linear-to-t from-black to-[#121212] border-t border-gray-800">
                  <button
                    onClick={handleSend}
                    disabled={selectedUsers.length === 0 || sending}
                    className={`w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl
                        ${
                          selectedUsers.length > 0
                            ? "bg-blue-500 text-white hover:bg-blue-400 cursor-pointer"
                            : "bg-gray-700 text-gray-400 cursor-not-allowed"
                        }
                      `}
                  >
                    {sending ? <LoadingOutlined /> : <SendOutlined />}
                    {sending
                      ? "Sending..."
                      : `Send ${
                          selectedUsers.length > 0
                            ? `(${selectedUsers.length})`
                            : ""
                        }`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraUI;
