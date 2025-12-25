import { useState, useEffect, useRef } from "react";
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
  updateParticipant,
  updateUser,
} from "@/store/actioncreator";
import { websocketService } from "@/lib/websocket";
import { useAuth } from "@/context/AuthContext";

export default function VideoChat() {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("id");
  const targetUserId = searchParams.get("target");
  const navigate = useNavigate();
  const streamRef = useRef(null);
  const cancelSentRef = useRef(false);
  const participantsRef = useRef({});

  const dispatch = useDispatch();
  const { user } = useAuth();
  const { participants, mainStream } = useSelector((state) => state.userState);

  const [messages] = useState([]);

  const sendCancelIfNeeded = () => {
    if (cancelSentRef.current) return;
    if (targetUserId && roomId) {
      websocketService.sendCallCancel(targetUserId, roomId);
      cancelSentRef.current = true;
    }
  };

  // Lắng nghe thay đổi media (audio/video) từ các user khác
  useEffect(() => {
    const unsubscribe = websocketService.onMediaPreferenceUpdated((data) => {
      if (!data?.userId || !data.preference) return;

      if (data.userId === user?.uid) {
        dispatch(updateUser({ [data.userId]: data.preference }));
      } else {
        dispatch(updateParticipant({ [data.userId]: data.preference }));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch, user?.uid]);

  const toggleMic = () => {
    if (mainStream) {
      const audioTrack = mainStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        // Notify other participants via WebSocket
        if (roomId && user?.uid) {
          websocketService.updateMediaPreference(roomId, {
            audio: audioTrack.enabled,
          });
        }
      }
    }
  };

  const toggleCamera = () => {
    if (mainStream) {
      const videoTrack = mainStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        // Notify other participants via WebSocket
        if (roomId && user?.uid) {
          websocketService.updateMediaPreference(roomId, {
            video: videoTrack.enabled,
          });
        }
      }
    }
  };

  // Keep latest participants in a ref for timeout checks
  useEffect(() => {
    participantsRef.current = participants || {};
  }, [participants]);

  // Auto-cancel if callee does not join within 10 seconds
  useEffect(() => {
    if (!targetUserId || !roomId) return;

    const timeoutId = setTimeout(() => {
      const hasTarget = !!participantsRef.current[targetUserId];
      if (!hasTarget) {
        sendCancelIfNeeded();
        navigate("/chat");
        window.location.reload();
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [targetUserId, roomId, navigate]);

  const performCleanup = async () => {
    sendCancelIfNeeded();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (roomId) {
      websocketService.leaveVideoRoom(roomId);
    }
  };

  const handleLeaveCall = async () => {
    await performCleanup();
    navigate("/chat");
    window.location.reload();
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
        // Lưu vào Ref để dùng cho cleanup sau này
        streamRef.current = stream;

        dispatch(setMainStream(stream));

        const userId = user.uid;
        const displayName = user.displayName || "Anonymous";
        const photoURL = user.photoURL || "/default-avatar.png";
        const userPayload = {
          [userId]: {
            displayName,
            photoURL,
            video: true,
            audio: true,
          },
        };

        // Connect WebSocket
        await websocketService.connect();

        // Dispatch SetUser kèm RoomID để khởi tạo listener offer/answer
        dispatch(setUser(userPayload, roomId));

        // Set up WebSocket listeners for participants BEFORE joining room
        const unsubscribeUserJoined = websocketService.onUserJoined((data) => {
          if (data.userId !== userId) {
            dispatch(
              addParticipant(
                {
                  [data.userId]: {
                    displayName: data.displayName || "Anonymous",
                    photoURL: data.photoURL || "/default-avatar.png",
                    video: true,
                    audio: true,
                  },
                },
                roomId
              )
            );
          }
        });

        const unsubscribeUserLeft = websocketService.onUserLeft((data) => {
          if (data.userId !== userId) {
            dispatch(removeParticipant(data.userId));
          }
        });

        const unsubscribeRoomParticipants = websocketService.onRoomParticipants(
          (data) => {
            // Handle initial participants list
            data.participants.forEach((participant) => {
              if (participant.userId !== userId) {
                dispatch(
                  addParticipant(
                    {
                      [participant.userId]: {
                        displayName: participant.displayName || "Anonymous",
                        photoURL: participant.photoURL || "/default-avatar.png",
                        video: true,
                        audio: true,
                      },
                    },
                    roomId
                  )
                );
              }
            });
          }
        );

        // Now join video room (profile included so peers get display info)
        websocketService.joinVideoRoom(roomId, { displayName, photoURL });

        const handleBeforeUnload = (e) => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
          }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
          window.removeEventListener("beforeunload", handleBeforeUnload);
          unsubscribeUserJoined();
          unsubscribeUserLeft();
          unsubscribeRoomParticipants();
          sendCancelIfNeeded();
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }
          websocketService.leaveVideoRoom(roomId);
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
            onLeave={handleLeaveCall}
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
