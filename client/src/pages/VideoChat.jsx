import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet";
import VideoGrid from "@/components/pages/video-chat/VideoGrid";
import ControlPanel from "@/components/pages/video-chat/ControlPanel";
import ParticipantsSidebar from "@/components/pages/video-chat/ParticipantsSidebar";
import ChatPanel from "@/components/pages/video-chat/ChatPanel";
import { Toaster } from "@/components/ui/toaster";
import {
  setMainStream,
  setUser,
  addParticipant,
  removeParticipant,
} from "@/store/actioncreator";
import { rtdb } from "@/lib/firebase";
import {
  ref,
  onValue,
  set,
  update,
  onDisconnect,
  onChildAdded,
  onChildRemoved,
} from "firebase/database";
import { useAuth } from "@/context/AuthContext";

export default function VideoChat() {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("id");
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { user } = useAuth();
  const { participants, mainStream } = useSelector((state) => state.userState);

  const [messages] = useState([]);

  const toggleMic = () => {
    if (mainStream) {
      const audioTrack = mainStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled); // Cập nhật UI
      }
    }
  };

  const toggleCamera = () => {
    if (mainStream) {
      const videoTrack = mainStream.getVideoTracks()[0];
      console.log(videoTrack);
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled); // Cập nhật UI
      }
    }
  };

  // Khởi tạo video call khi component mount
  useEffect(() => {
    if (!roomId) {
      console.error("Missing Room ID");
      navigate("/");
      return;
    }

    const initVideoCall = async () => {
      if (!user?.uid) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        dispatch(setMainStream(stream));

        const userId = user.uid;
        const displayName = user.displayName || "Anonymous";
        const userPayload = {
          [userId]: {
            displayName,
            photoURL: user.photoURL || "/default-avatar.png",
            video: true,
            audio: true,
          },
        };

        // Dispatch SetUser kèm RoomID để khởi tạo listener offer/answer
        dispatch(setUser(userPayload, roomId));

        // Lưu user vào Firebase Room
        const participantRef = ref(
          rtdb,
          `rooms/${roomId}/participants/${userId}`
        );
        await set(participantRef, {
          displayName,
          photoURL: user.photoURL || "/default-avatar.png",
          preferences: { video: true, audio: true },
        });

        // Xử lý khi disconnect (tắt tab)
        onDisconnect(participantRef).remove();

        // Lắng nghe người khác tham gia vào PHÒNG NÀY
        const roomParticipantsRef = ref(rtdb, `rooms/${roomId}/participants`);

        // Handle User Added
        const unsubscribeAdded = onChildAdded(
          roomParticipantsRef,
          (snapshot) => {
            const newUserId = snapshot.key;
            const data = snapshot.val();

            // Chỉ add participant khác mình
            if (newUserId !== userId) {
              dispatch(
                addParticipant(
                  {
                    [newUserId]: {
                      displayName: data.displayName || "Anonymous",
                      photoURL: data.photoURL || "/default-avatar.png",
                      video: data.preferences?.video ?? true,
                      audio: data.preferences?.audio ?? true,
                    },
                  },
                  roomId
                )
              ); // Pass roomId
            }
          }
        );

        // Handle User Removed
        const unsubscribeRemoved = onChildRemoved(
          roomParticipantsRef,
          (snapshot) => {
            dispatch(removeParticipant(snapshot.key));
          }
        );

        return () => {
          unsubscribeAdded();
          unsubscribeRemoved();
          stream.getTracks().forEach((track) => track.stop());
          // Remove self from room explicitly on component unmount
          set(participantRef, null);
        };
      } catch (error) {
        console.error("Error initializing video call:", error);
      }
    };

    initVideoCall();
  }, [user?.uid, roomId, dispatch, navigate]);

  return (
    <>
      <Helmet>
        <title>Group Video Chat - Connect with Friends</title>
        <meta
          name="description"
          content="Join group video chats with friends and colleagues using our modern, Snapchat-style video chat interface with real-time communication features."
        />
      </Helmet>

      <div className="min-h-screen bg-linear-to-br from-yellow-300 via-yellow-200 to-blue-200 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 h-screen flex flex-col">
          {/* Video Grid Area */}
          <div className="flex-1 p-4 md:p-6 overflow-hidden">
            <VideoGrid isCameraOff={isCameraOff} />
          </div>

          {/* Control Panel */}
          <ControlPanel
            isMuted={isMuted}
            toggleMic={toggleMic}
            isCameraOff={isCameraOff}
            toggleCamera={toggleCamera}
            isChatOpen={isChatOpen}
            setIsChatOpen={setIsChatOpen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            participantCount={Object.keys(participants).length + 1}
          />
        </div>

        {/* Participants Sidebar */}
        <ParticipantsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          participants={Object.values(participants)}
        />

        {/* Chat Panel */}
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
        />

        <Toaster />
      </div>
    </>
  );
}
