import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

import UserChat from "./User";
import { useAuth } from "../../../../context/AuthContext";

export default function ChatList() {
  const { user } = useAuth();

  const [chats, setChats] = useState([]);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "userchats", user.uid), async (res) => {
      const items = res.data().chats;
      const promises = items.map(async (item) => {
        const userDocRef = doc(db, "users", item.receiverId);
        const userDocSnap = await getDoc(userDocRef);

        const receiver = userDocSnap.data();
        return { ...item, receiver };
      });
      const chatData = await Promise.all(promises);
      setChats(chatData.sort((a, b) => b.updateAt - a.updateAt));
    });
    return () => {
      unSub();
    };
  }, [user.uid]);

  return (
    <>
      <div className="flex flex-col gap-3">
        {chats?.map((chat, idx) => (
          <UserChat key={idx} receiver={chat?.receiver} chat={chat} />
        ))}
      </div>
    </>
  );
}
