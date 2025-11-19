import { rtdb } from "./firebase";
import { ref, onValue, push, update, onChildAdded } from "firebase/database";
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
    console.log(
      `🔄 Đang xử lý ${candidateQueue[userId].length} candidates hàng đợi cho ${userId}`
    );
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
  const preferenceRef = ref(
    rtdb,
    `rooms/${roomId}/participants/${userId}/preferences`
  );
  setTimeout(() => {
    update(preferenceRef, preference);
  });
};

export const createOffer = async (
  peerConnection,
  receiverId,
  createdID,
  roomId
) => {
  console.log("da chay vao day");
  const offerCandidatesRef = ref(
    rtdb,
    `rooms/${roomId}/participants/${receiverId}/offerCandidates`
  );
  const offersRef = ref(
    rtdb,
    `rooms/${roomId}/participants/${receiverId}/offers`
  );

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      push(offerCandidatesRef, {
        ...event.candidate.toJSON(),
        userId: createdID,
      });
    }
  };

  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
    userId: createdID,
  };

  console.log("offer = ", offer);

  push(offersRef, { offer });
};

export const initializeListeners = async (userId, roomId) => {
  const roomPath = `rooms/${roomId}/participants/${userId}`;
  const offersRef = ref(rtdb, `${roomPath}/offers`);
  const offerCandidatesRef = ref(rtdb, `${roomPath}/offerCandidates`);
  const answersRef = ref(rtdb, `${roomPath}/answers`);
  const answerCandidatesRef = ref(rtdb, `${roomPath}/answerCandidates`);

  onChildAdded(offersRef, async (snapshot) => {
    const data = snapshot.val();

    // Kiểm tra xem có offer và người gửi không phải là chính mình
    if (data?.offer && data.offer.userId !== userId) {
      console.log("📩 Đã nhận được Offer từ:", data.offer.userId);

      const senderId = data.offer.userId;

      const pc = participantConnections[senderId];

      // Bên trong listener nhận Offer
      if (pc) {
        try {
          console.log("Trạng thái hiện tại:", pc.signalingState);

          const isReadyToReceive =
            pc.signalingState === "stable" ||
            pc.signalingState === "have-remote-offer";

          if (isReadyToReceive) {
            console.log("⚙️ Đang set Remote Description...");

            await pc.setRemoteDescription(
              new RTCSessionDescription(data.offer)
            );

            console.log("Trạng thái sau khi set Remote:", pc.signalingState);

            await processCandidateQueue(senderId, pc);

            console.log("✍️ Đang tạo Answer...");
            await createAnswer(senderId, userId, roomId);
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
    }
  });

  // 2. Lắng nghe ICE Candidates cho Offer (Sửa onValue -> onChildAdded)
  onChildAdded(offerCandidatesRef, (snapshot) => {
    const data = snapshot.val();
    if (data?.userId && data?.candidate) {
      const pc = participantConnections[data.userId];
      if (pc) {
        if (pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate(data)).catch(console.error);
        } else {
          console.warn("⏳ Candidate đến sớm, đang đưa vào hàng đợi...");
          if (!candidateQueue[data.userId]) candidateQueue[data.userId] = [];
          candidateQueue[data.userId].push(data);
        }
      }
    }
  });

  // 3. Lắng nghe Answer
  onChildAdded(answersRef, async (snapshot) => {
    const data = snapshot.val();
    if (data?.answer && data.answer.userId !== userId) {
      console.log("📩 Đã nhận Answer từ:", data.answer.userId);
      const pc = participantConnections[data.answer.userId];

      if (pc) {
        try {
          if (!pc.currentRemoteDescription) {
            await pc.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
            console.log("✅ Đã set Remote Description (Answer)");
            await processCandidateQueue(data.answer.userId, pc);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  });

  // 4. Lắng nghe ICE Candidates cho Answer
  onChildAdded(answerCandidatesRef, (snapshot) => {
    const data = snapshot.val();
    if (data?.userId && data?.candidate) {
      const pc = participantConnections[data.userId];

      if (pc) {
        if (pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate(data)).catch(console.error);
        } else {
          console.warn("⏳ Answer Candidate đến sớm, đưa vào hàng đợi...");
          if (!candidateQueue[data.userId]) candidateQueue[data.userId] = [];
          candidateQueue[data.userId].push(data);
        }
      }
    }
  });
};

const createAnswer = async (otherUserId, userId, roomId) => {
  // const state = store.getState();
  // const pc = state.userState.participants[otherUserId]?.peerConnection;
  const pc = participantConnections[otherUserId];
  if (!pc) {
    console.error("Không tìm thấy PC để tạo answer");
    return;
  }

  const answerCandidatesRef = ref(
    rtdb,
    `rooms/${roomId}/participants/${otherUserId}/answerCandidates`
  );
  const answersRef = ref(
    rtdb,
    `rooms/${roomId}/participants/${otherUserId}/answers`
  );

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      push(answerCandidatesRef, {
        ...event.candidate.toJSON(),
        userId: userId,
      });
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
  console.log("✅ Đã tạo và gửi Answer:", answer);
  push(answersRef, { answer });
};

// Tạo kết nối và xử lý stream
export const addConnection = (newUser, currentUser, stream, roomId) => {
  const newUserId = Object.keys(newUser)[0];
  console.log("newUserId = ", newUserId);
  console.log("state.mainstream = ", stream);
  if (participantConnections[newUserId]) {
    console.log("Connection already exists for", newUserId);
    return newUser;
  }
  const peerConnection = new RTCPeerConnection(servers);
  participantConnections[newUserId] = peerConnection;
  if (stream) {
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
  }

  console.log("peerConnection = ", peerConnection);

  peerConnection.ontrack = (event) => {
    console.log("📡 Received Remote Stream from:", Object.keys(newUser)[0]);
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
  console.log(offerIds);

  if (offerIds[0] === currentUserId) {
    console.log("🚀 Tôi là người tạo Offer (Initiator)");
    createOffer(peerConnection, newUserId, currentUserId, roomId);
  } else {
    console.log("⏳ Tôi sẽ đợi Offer từ phía bên kia (Receiver)");
  }

  return newUser;
};
