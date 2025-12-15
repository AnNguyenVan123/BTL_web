const functions = require("firebase-functions");
const { db, FieldValue } = require("../config/firebase");
// API 1: Gửi lời mời kết bạn
exports.sendFriendRequest = async (request) => {
  // 1. Kiểm tra Auth
  const data = request.data;
  const auth = request.auth;

  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Bạn phải đăng nhập."
    );
  }

  const senderUid = auth.uid;
  const receiverUid = data.targetUid;

  const senderRef = db.collection("users").doc(senderUid);
  const receiverRef = db.collection("users").doc(receiverUid);

  await db.runTransaction(async (transaction) => {
    const senderDoc = await transaction.get(senderRef);
    const receiverDoc = await transaction.get(receiverRef);

    if (!receiverDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Người dùng không tồn tại."
      );
    }

    const senderData = senderDoc.data();
    const receiverData = receiverDoc.data();

    if (senderData.friends && senderData.friends.includes(receiverUid)) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Đã là bạn bè rồi."
      );
    }

    if (
      senderData.sentRequests &&
      senderData.sentRequests.includes(receiverUid)
    ) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Đã gửi lời mời rồi."
      );
    }

    const hasIncomingRequest = (senderData.friendRequests || []).some(
      (req) => req.uid === receiverUid
    );
    if (hasIncomingRequest) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Người này đã gửi lời mời cho bạn. Hãy kiểm tra tab Requests."
      );
    }

    if (receiverData.blocked && receiverData.blocked.includes(senderUid)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Bạn không thể gửi lời mời."
      );
    }

    transaction.update(receiverRef, {
      friendRequests: FieldValue.arrayUnion({
        uid: senderUid,
        displayName: senderData.displayName || "Unknown",
        email: senderData.email || "",
        photoURL: senderData.photoURL || "",
      }),
    });

    transaction.update(senderRef, {
      sentRequests: FieldValue.arrayUnion(receiverUid),
    });
  });

  return { message: "Success" };
};

// API 2: Chấp nhận kết bạn
exports.acceptFriendRequest = async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Bạn phải đăng nhập."
    );
  }

  const myUid = request.auth.uid;
  const partnerUid = request.data.targetUid; // ID người gửi lời mời (người mình sắp accept)

  const myRef = db.collection("users").doc(myUid);
  const partnerRef = db.collection("users").doc(partnerUid);

  const myUserChatRef = db.collection("userchats").doc(myUid);
  const partnerUserChatRef = db.collection("userchats").doc(partnerUid);

  const chatRef = db.collection("chats").doc(); // Tạo ID mới cho đoạn chat

  await db.runTransaction(async (t) => {
    const myDoc = await t.get(myRef);
    const partnerDoc = await t.get(partnerRef);

    if (!myDoc.exists || !partnerDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User không tồn tại");
    }

    const myData = myDoc.data();

    // 1. TÌM OBJECT REQUEST CŨ ĐỂ XÓA
    const requestObject = (myData.friendRequests || []).find(
      (req) => req.uid === partnerUid
    );

    if (!requestObject) {
      throw new functions.https.HttpsError(
        "not-found",
        "Lời mời kết bạn không tồn tại hoặc đã bị hủy."
      );
    }

    // 2. Tạo Chat Room mới
    t.set(chatRef, {
      createdAt: FieldValue.serverTimestamp(),
      messages: [],
    });

    // 3. Update UserChats cho MÌNH
    t.set(
      myUserChatRef,
      {
        chats: FieldValue.arrayUnion({
          chatId: chatRef.id,
          receiverId: partnerUid,
          updatedAt: Date.now(),
          lastMessage: "",
        }),
      },
      { merge: true }
    );

    // 4. Update UserChats cho ĐỐI PHƯƠNG
    t.set(
      partnerUserChatRef,
      {
        chats: FieldValue.arrayUnion({
          chatId: chatRef.id,
          receiverId: myUid,
          updatedAt: Date.now(),
          lastMessage: "",
        }),
      },
      { merge: true }
    );

    // 5. DỌN DẸP REQUEST
    t.update(myRef, {
      friendRequests: FieldValue.arrayRemove(requestObject),
    });

    t.update(partnerRef, {
      sentRequests: FieldValue.arrayRemove(myUid),
    });
  });

  return { success: true };
};

// API 3: Từ chối lời mời kết bạn
exports.rejectFriendRequest = async (request) => {
  const auth = request.auth;
  const data = request.data;

  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Bạn phải đăng nhập."
    );
  }

  const myUid = auth.uid;
  const partnerUid = data.targetUid;

  const myRef = db.collection("users").doc(myUid);
  const partnerRef = db.collection("users").doc(partnerUid);

  await db.runTransaction(async (t) => {
    const myDoc = await t.get(myRef);
    if (!myDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User không tồn tại");
    }

    const myData = myDoc.data();

    const requestObject = (myData.friendRequests || []).find(
      (req) => req.uid === partnerUid
    );

    if (!requestObject) {
      return;
    }

    t.update(myRef, {
      friendRequests: FieldValue.arrayRemove(requestObject),
    });

    t.update(partnerRef, {
      sentRequests: FieldValue.arrayRemove(myUid),
    });
  });

  return { success: true };
};
