import { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import UserChat from "./User";
import { useAuth } from "../../../../context/AuthContext";
import { websocketService } from "../../../../lib/websocket";

export default function ChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const userCacheRef = useRef(new Map());
  const optimisticUpdatesRef = useRef(new Map());
  const fetchingRef = useRef(new Set());

  const toMillis = (time) => {
    if (!time) return 0;
    if (typeof time === "number") return time;
    if (typeof time.toMillis === "function") return time.toMillis();
    if (time.seconds) return time.seconds * 1000;
    if (time instanceof Date || typeof time === "string") {
      return new Date(time).getTime();
    }
    return 0;
  };

  const mergeWithOptimistic = (chatItem) => {
    const optimistic = optimisticUpdatesRef.current.get(chatItem.chatId);
    if (!optimistic) return chatItem;
    const firestoreTime = toMillis(chatItem.updatedAt);
    const optimisticTime = toMillis(optimistic.updatedAt);
    if (firestoreTime >= optimisticTime) {
      if (chatItem.lastMessage && chatItem.lastMessage !== "No messages yet") {
        optimisticUpdatesRef.current.delete(chatItem.chatId);
        return chatItem;
      }

      return {
        ...chatItem,
        lastMessage: optimistic.lastMessage || chatItem.lastMessage,
        lastSenderId: optimistic.lastSenderId || chatItem.lastSenderId,
        isSeen: chatItem.isSeen,
        updatedAt: firestoreTime,
      };
    }
    return {
      ...chatItem,
      lastMessage: optimistic.lastMessage,
      lastSenderId: optimistic.lastSenderId,
      isSeen: optimistic.isSeen,
      updatedAt: optimisticTime,
    };
  };

  const fetchSingleChatData = async (chatId, receiverId, isGroup) => {
    try {
      if (isGroup) {
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          return {
            receiver: {
              uid: chatId,
              displayName: data.groupName || "Group Chat",
              photoURL: data.groupPhoto || "/default-avatar.png",
            },
            isGroup: true,
          };
        }
      } else if (receiverId) {
        if (userCacheRef.current.has(receiverId)) {
          return {
            receiver: userCacheRef.current.get(receiverId),
            isGroup: false,
          };
        }

        const userDoc = await getDoc(doc(db, "users", receiverId));
        const userData = userDoc.exists()
          ? userDoc.data()
          : { displayName: "User Deleted" };

        userCacheRef.current.set(receiverId, userData);

        return {
          receiver: userData,
          isGroup: false,
        };
      }
      return null;
    } catch (error) {
      console.error("Lỗi fetch single chat:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    const fetchChats = async () => {
      try {
        const userChatsRef = doc(db, "userchats", user.uid);
        const docSnap = await getDoc(userChatsRef);

        if (!docSnap.exists()) {
          setChats([]);
          return;
        }
        const items = docSnap.data().chats || [];
        const promises = items.map(async (item) => {
          const itemWithTime = {
            ...item,
            updatedAt: toMillis(item.updatedAt),
          };

          if (item.type === "group") {
            return {
              ...itemWithTime,
              receiver: {
                uid: item.chatId,
                displayName: item.displayName || item.groupName || "Group Chat",
                photoURL:
                  item.photoURL || item.groupPhoto || "/default-avatar.png",
              },
              isGroup: true,
            };
          } else {
            const cachedUser = userCacheRef.current.get(item.receiverId);
            if (cachedUser) {
              return {
                ...itemWithTime,
                receiver: cachedUser,
                isGroup: false,
              };
            }

            try {
              const userDocRef = doc(db, "users", item.receiverId);
              const userDocSnap = await getDoc(userDocRef);
              const userData = userDocSnap.data() || {
                displayName: "User Deleted",
              };

              userCacheRef.current.set(item.receiverId, userData);

              return {
                ...itemWithTime,
                receiver: userData,
                isGroup: false,
              };
            } catch (err) {
              console.error("Error fetching user details:", err);
              return {
                ...itemWithTime,
                receiver: { displayName: "Unknown User" },
                isGroup: false,
              };
            }
          }
        });

        const chatData = await Promise.all(promises);
        const fetchedChats = chatData.map(mergeWithOptimistic);
        setChats((currentChats) => {
          const chatMap = new Map();
          fetchedChats.forEach((chat) => chatMap.set(chat.chatId, chat));
          currentChats.forEach((currentChat) => {
            const apiChat = chatMap.get(currentChat.chatId);
            if (!apiChat) {
              chatMap.set(currentChat.chatId, currentChat);
            } else if (currentChat.updatedAt > apiChat.updatedAt) {
              chatMap.set(currentChat.chatId, {
                ...apiChat,
                lastMessage: currentChat.lastMessage,
                lastSenderId: currentChat.lastSenderId,
                updatedAt: currentChat.updatedAt,
                isSeen: currentChat.isSeen,
              });
            }
          });
          return Array.from(chatMap.values()).sort(
            (a, b) => b.updatedAt - a.updatedAt
          );
        });
      } catch (error) {
        console.error("Lỗi fetchChats:", error);
      }
    };

    fetchChats();
  }, [user?.uid]);

  useEffect(() => {
    const unsubscribeSidebar = websocketService.onUpdateSidebar(
      async (data) => {
        const { chatId, lastMessage, lastSenderId, isSeen, updatedAt } = data;
        console.log("[SOCKET] Nhận data update-sidebar:", data);

        const timeMillis =
          typeof updatedAt === "number" ? updatedAt : toMillis(updatedAt);
        setChats((prevChats) => {
          const chatIndex = prevChats.findIndex(
            (chat) => chat.chatId === chatId
          );
          if (chatIndex !== -1) {
            const updatedChats = [...prevChats];
            updatedChats[chatIndex] = {
              ...updatedChats[chatIndex],
              lastMessage,
              lastSenderId,
              isSeen,
              updatedAt: timeMillis,
            };
            return updatedChats.sort((a, b) => b.updatedAt - a.updatedAt);
          }
          handleNewChatFetch(data);
          return prevChats;
        });
      }
    );

    const handleNewChatFetch = async (socketData) => {
      const {
        chatId,
        lastMessage,
        lastSenderId,
        isSeen,
        updatedAt,
        receiverId,
        isGroup,
        groupName,
        groupPhoto,
      } = socketData;
      if (fetchingRef.current.has(chatId)) {
        console.warn(`Đang fetch dở chatId ${chatId}, bỏ qua request trùng.`);
        return;
      }
      fetchingRef.current.add(chatId);
      const timeMillis =
        typeof updatedAt === "number" ? updatedAt : toMillis(updatedAt);
      try {
        let details = await fetchSingleChatData(chatId, receiverId, isGroup);
        if (!details) {
          if (isGroup) {
            details = {
              receiver: {
                uid: chatId,
                displayName: groupName || "Group Chat",
                photoURL: groupPhoto || "/default-avatar.png",
              },
              isGroup: true,
            };
          } else {
            details = {
              receiver: {
                uid: receiverId || "unknown",
                displayName: "Loading...",
                photoURL: "/default-avatar.png",
              },
              isGroup: false,
            };
          }
        }
        const newRealChat = {
          chatId,
          lastMessage,
          lastSenderId,
          isSeen,
          updatedAt: timeMillis,
          receiverId,
          type: isGroup ? "group" : "private",
          ...details,
        };
        setChats((prev) => {
          const exists = prev.some((c) => c.chatId === chatId);
          if (exists) {
            return prev.map((c) =>
              c.chatId === chatId ? { ...c, ...newRealChat } : c
            );
          }
          return [newRealChat, ...prev];
        });
      } finally {
        fetchingRef.current.delete(chatId);
      }
    };
    return () => unsubscribeSidebar();
  }, [user?.uid]);

  useEffect(() => {
    const handleMarkAsSeen = (chatId) => {
      const currentOptimistic = optimisticUpdatesRef.current.get(chatId) || {};
      optimisticUpdatesRef.current.set(chatId, {
        ...currentOptimistic,
        isSeen: true,
      });

      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.chatId === chatId) {
            return {
              ...chat,
              isSeen: true,
            };
          }
          return chat;
        });
      });
    };

    window.__markChatAsSeenOptimistic = handleMarkAsSeen;

    return () => {
      delete window.__markChatAsSeenOptimistic;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = websocketService.onChatRemoved((data) => {
      setChats((prev) => prev.filter((c) => c.chatId !== data.chatId));
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="flex flex-col gap-3">
        {chats?.map((chat) => (
          <UserChat
            key={chat.chatId}
            receiver={chat?.receiver}
            chat={chat}
            isGroup={chat.isGroup}
          />
        ))}
      </div>
    </>
  );
}
