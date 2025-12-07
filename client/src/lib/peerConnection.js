import { rtdb } from "./firebase";
import { ref, onValue, push, update } from "firebase/database";
import { store } from "../main"; // Import store để dispatch action từ listener
import { updateParticipant } from "../store/actioncreator";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
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

  push(offersRef, { offer });
};

export const initializeListeners = async (userId, roomId) => {
  const roomPath = `rooms/${roomId}/participants/${userId}`;
  const offersRef = ref(rtdb, `${roomPath}/offers`);
  const offerCandidatesRef = ref(rtdb, `${roomPath}/offerCandidates`);
  const answersRef = ref(rtdb, `${roomPath}/answers`);
  const answerCandidatesRef = ref(rtdb, `${roomPath}/answerCandidates`);

  // Lắng nghe Offer
  onValue(offersRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data?.offer && data.offer.userId !== userId) {
        const state = store.getState();
        // Tìm PC của người gửi offer
        const pc =
          state.userState.participants[data.offer.userId]?.peerConnection;
        if (pc) {
          pc.setRemoteDescription(new RTCSessionDescription(data.offer)).then(
            () => createAnswer(data.offer.userId, userId, roomId)
          );
        }
      }
    });
  });

  // Lắng nghe ICE Candidates cho Offer
  onValue(offerCandidatesRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data?.userId) {
        const state = store.getState();
        const pc = state.userState.participants[data.userId]?.peerConnection;
        if (pc && data.candidate) {
          pc.addIceCandidate(new RTCIceCandidate(data)).catch(console.error);
        }
      }
    });
  });

  // Lắng nghe Answer
  onValue(answersRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data?.answer && data.answer.userId !== userId) {
        const state = store.getState();
        const pc =
          state.userState.participants[data.answer.userId]?.peerConnection;
        if (pc) {
          pc.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(
            console.error
          );
        }
      }
    });
  });

  // Lắng nghe ICE Candidates cho Answer
  onValue(answerCandidatesRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data?.userId) {
        const state = store.getState();
        const pc = state.userState.participants[data.userId]?.peerConnection;
        if (pc && data.candidate) {
          pc.addIceCandidate(new RTCIceCandidate(data)).catch(console.error);
        }
      }
    });
  });
};

const createAnswer = async (otherUserId, userId, roomId) => {
  const state = store.getState();
  const pc = state.userState.participants[otherUserId]?.peerConnection;
  if (!pc) return;

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
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
    userId: userId,
  };

  push(answersRef, { answer });
};

// Hàm quan trọng nhất: Tạo kết nối và xử lý stream
export const addConnection = (newUser, currentUser, stream, roomId) => {
  const peerConnection = new RTCPeerConnection(servers);

  if (stream) {
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
  }

  const newUserId = Object.keys(newUser)[0];
  const currentUserId = Object.keys(currentUser)[0];

  // **QUAN TRỌNG: Lắng nghe remote stream**
  peerConnection.ontrack = (event) => {
    // Dispatch action để update stream vào Redux state
    // Lưu ý: Stream là object phức tạp, Redux có thể warning, nhưng cần thiết cho video
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

  const offerIds = [newUserId, currentUserId].sort((a, b) =>
    a.localeCompare(b)
  );

  newUser[newUserId].peerConnection = peerConnection;

  if (offerIds[0] === currentUserId) {
    createOffer(peerConnection, newUserId, currentUserId, roomId);
  }

  return newUser;
};
