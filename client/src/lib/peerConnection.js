import { websocketService } from "./websocket";
import { store } from "../main";
import { updateParticipant } from "../store/actioncreator";

export const participantConnections = {};
const candidateQueue = {};

const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
        "stun:stun.services.mozilla.com",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Hàm hỗ trợ: Xử lý hàng đợi Candidate
const processCandidateQueue = async (userId, pc) => {
  if (candidateQueue[userId] && candidateQueue[userId].length > 0) {
    for (const candidate of candidateQueue[userId]) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Lỗi add buffered candidate:", error);
      }
    }
    // Xóa hàng đợi sau khi xử lý xong
    delete candidateQueue[userId];
  }
};

// Update preferences (audio/video) theo Room
export const updatePreference = (userId, preference, roomId) => {
  websocketService.updateMediaPreference(roomId, preference);
};

export const createOffer = async (
  peerConnection,
  receiverId,
  createdID,
  roomId
) => {
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      websocketService.sendICECandidate(
        event.candidate.toJSON(),
        receiverId,
        roomId
      );
    }
  };

  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
    userId: createdID,
  };

  websocketService.sendWebRTCOffer(offer, receiverId, roomId);
};

export const initializeListeners = async (userId, roomId) => {
  // Set up WebSocket listeners for WebRTC signaling

  // Listen for WebRTC offers
  const unsubscribeOffer = websocketService.onWebRTCOffer(async (data) => {
    const { offer, fromUserId, roomId: receivedRoomId } = data;

    if (receivedRoomId !== roomId || offer.userId === userId) return;

    const pc = participantConnections[fromUserId];

    if (pc) {
      try {
        const isReadyToReceive =
          pc.signalingState === "stable" ||
          pc.signalingState === "have-remote-offer";

        if (isReadyToReceive) {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await processCandidateQueue(fromUserId, pc);
          await createAnswer(fromUserId, userId, roomId);
        } else {
          console.warn(
            "⚠️ Bỏ qua Offer vì đang bận xử lý tiến trình khác (Glare):",
            pc.signalingState
          );
        }
      } catch (error) {
        console.error("❌ Lỗi khi xử lý Offer:", error);
      }
    }
  });

  // Listen for WebRTC answers
  const unsubscribeAnswer = websocketService.onWebRTCAnswer(async (data) => {
    const { answer, fromUserId, roomId: receivedRoomId } = data;

    if (receivedRoomId !== roomId || answer.userId === userId) return;

    const pc = participantConnections[fromUserId];

    if (pc) {
      try {
        if (!pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await processCandidateQueue(fromUserId, pc);
        }
      } catch (e) {
        console.error(e);
      }
    }
  });

  // Listen for ICE candidates
  const unsubscribeICE = websocketService.onICECandidate((data) => {
    const { candidate, fromUserId, roomId: receivedRoomId } = data;

    if (receivedRoomId !== roomId) return;

    const pc = participantConnections[fromUserId];
    if (pc) {
      if (pc.remoteDescription) {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      } else {
        console.warn("⏳ Candidate đến sớm, đang đưa vào hàng đợi...");
        if (!candidateQueue[fromUserId]) candidateQueue[fromUserId] = [];
        candidateQueue[fromUserId].push(candidate);
      }
    }
  });

  // Return cleanup function
  return () => {
    unsubscribeOffer();
    unsubscribeAnswer();
    unsubscribeICE();
  };
};

const createAnswer = async (otherUserId, userId, roomId) => {
  const pc = participantConnections[otherUserId];
  if (!pc) {
    console.error("Không tìm thấy PC để tạo answer");
    return;
  }

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      websocketService.sendICECandidate(
        event.candidate.toJSON(),
        otherUserId,
        roomId
      );
    }
  };

  const answerDescription = await pc.createAnswer();
  if (pc.signalingState === "stable") {
    console.warn(
      "⚠️ Connection đã stable, bỏ qua việc setLocalDescription trùng lặp."
    );
    return;
  }
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
    userId: userId,
  };
  websocketService.sendWebRTCAnswer(answer, otherUserId, roomId);
};

// Tạo kết nối và xử lý stream
export const addConnection = (newUser, currentUser, stream, roomId) => {
  const newUserId = Object.keys(newUser)[0];
  if (participantConnections[newUserId]) {
    return newUser;
  }
  const peerConnection = new RTCPeerConnection(servers);
  participantConnections[newUserId] = peerConnection;
  if (stream) {
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
  }

  peerConnection.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      store.dispatch(
        updateParticipant({
          [newUserId]: {
            stream: event.streams[0],
          },
        })
      );
    }
  };

  const currentUserId = Object.keys(currentUser)[0];
  const offerIds = [newUserId, currentUserId].sort((a, b) =>
    a.localeCompare(b)
  );

  if (offerIds[0] === currentUserId) {
    createOffer(peerConnection, newUserId, currentUserId, roomId);
  } else {
  }

  return newUser;
};
