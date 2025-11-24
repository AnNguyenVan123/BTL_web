import { useContext, useState } from "react";
import "./styles.css";
import { Input, Space } from "antd";
import { UserAddOutlined, CheckOutlined } from "@ant-design/icons";

import { db } from "../../../../lib/firebase";

import {
  collection,
  query,
  where,
  getDocs,
  limit,
  setDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

import { ChatContext } from "../../../../context/ChatContext";
import { useAuth } from "../../../../context/AuthContext";

export default function AddUser() {
  const { toggleAddUser } = useContext(ChatContext);
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [addingStatus, setAddingStatus] = useState({});

  const handleSearch = async (value) => {
    setSearch(value);

    if (value.trim() === "") {
      setResults([]);
      return;
    }
    const usersRef = collection(db, "users");
    const q1 = query(
      usersRef,
      where("displayName", ">=", value),
      where("displayName", "<=", value + "\uf8ff"),
      limit(10)
    );
    const q2 = query(
      usersRef,
      where("email", ">=", value),
      where("email", "<=", value + "\uf8ff"),
      limit(10)
    );
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const temp = [];
    snap1.forEach((doc) => temp.push(doc.data()));
    snap2.forEach((doc) => temp.push(doc.data()));
    const unique = Array.from(new Map(temp.map((u) => [u.uid, u])).values());
    setResults(unique);
  };

  const handleAdd = async (receiver) => {
    const chatRef = collection(db, "chats");
    const userChatRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      await updateDoc(doc(userChatRef, receiver.uid), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.uid,
          updatedAt: Date.now(),
        }),
      });

      await updateDoc(doc(userChatRef, user.uid), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: receiver.uid,
          updatedAt: Date.now(),
        }),
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      {toggleAddUser && (
        <div className="w-[350px] bg-[#121212] custom-add-user p-3 rounded-tr-3xl rounded-bl-3xl rounded-br-3xl">
          <p className="font-semibold text-white text-center">Add Friends</p>
          <Space.Compact className="my-4">
            <Input
              placeholder="Search..."
              className="input"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </Space.Compact>
          <div className="bg-[#292929] text-white text-sm min-h-40 rounded-3xl p-3">
            {results.map((u) => {
              const status = addingStatus[u.uid] || "idle";

              return (
                <div key={u.uid} className="flex justify-between">
                  <div className="flex items-center gap-3 hover:bg-[#333] rounded-xl cursor-pointer">
                    <img
                      src={u.photoURL || "/default-avatar.png"}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">{u.displayName}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>

                  <button
                    className={`flex gap-1 items-center px-3 rounded-3xl h-8 cursor-pointer
          ${
            status === "added"
              ? "bg-blue-500 text-white"
              : "bg-[#424242] text-white"
          }`}
                    onClick={async () => {
                      if (status !== "idle") return;
                      setAddingStatus((prev) => ({
                        ...prev,
                        [u.uid]: "loading",
                      }));

                      try {
                        await handleAdd(u);
                        setAddingStatus((prev) => ({
                          ...prev,
                          [u.uid]: "added",
                        }));
                      } catch (err) {
                        console.log(err);
                        setAddingStatus((prev) => ({
                          ...prev,
                          [u.uid]: "idle",
                        }));
                      }
                    }}
                  >
                    {status === "loading" ? (
                      <span className="loader w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : status === "added" ? (
                      <>
                        <CheckOutlined />
                        <p className="text-xs font-semibold">Added</p>
                      </>
                    ) : (
                      <>
                        <UserAddOutlined />
                        <p className="text-xs">Add</p>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
