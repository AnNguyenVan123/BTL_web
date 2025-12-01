import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, remove } from "firebase/database";
import { rtdb } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const IncomingCallDialog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [callData, setCallData] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    const callRef = ref(rtdb, `users/${user.uid}/incomingCall`);

    const unsubscribe = onValue(callRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCallData(data);
        // Có thể thêm nhạc chuông ở đây (Audio.play())
      } else {
        setCallData(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleAccept = async () => {
    if (!callData || !user?.uid) return;

    const roomId = callData.roomId;

    const callRef = ref(rtdb, `users/${user.uid}/incomingCall`);
    await remove(callRef);

    navigate(`/video-chat?id=${roomId}`);
  };

  const handleDecline = async () => {
    if (!user?.uid) return;

    // Xóa thông báo trên Firebase
    const callRef = ref(rtdb, `users/${user.uid}/incomingCall`);
    await remove(callRef);
  };

  return (
    <AnimatePresence>
      {callData && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 right-4 z-50 w-full max-w-sm"
        >
          <div className="bg-white/90 backdrop-blur-md border-2 border-yellow-400 rounded-2xl shadow-2xl p-4 overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-4 border-blue-200">
                  <AvatarImage src={callData.callerPhoto} />
                  <AvatarFallback>{callData.callerName?.[0]}</AvatarFallback>
                </Avatar>
                <span className="absolute -inset-1 rounded-full border-2 border-green-500 animate-ping"></span>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  {callData.callerName}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Video className="w-3 h-3" /> Incoming Video Call...
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
                Decline
              </button>

              <button
                onClick={handleAccept}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 transition-all"
              >
                <Phone className="w-5 h-5 animate-pulse" />
                Answer
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IncomingCallDialog;
