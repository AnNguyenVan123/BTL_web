import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Settings, Users, Flame } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserData(snap.data());
    };
    fetchUserData();
  }, [user]);

  if (!user) return <p className="text-center mt-10">⚠️ Bạn chưa đăng nhập.</p>;
  if (!userData) return <p className="text-center mt-10">Đang tải...</p>;

  return (
<div className="min-h-screen bg-[#fffefb] text-gray-800">
  {/* Header */}
  <div className="sticky top-0 bg-white border-b border-gray-100 shadow-sm z-10">
    <div className="max-w-3xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 py-4">
      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-full hover:bg-gray-100 transition"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>

      <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Profile</h1>

      <Link
        to="/settings"
        className="p-2 rounded-full text-yellow-500 font-semibold hover:text-yellow-600 transition"
      >
        <Settings className="w-6 h-6 sm:w-7 sm:h-7" />
      </Link>
    </div>
  </div>

  {/* Avatar + Info */}
  <div className="max-w-3xl mx-auto flex flex-col items-center mt-8 px-4 sm:px-6 md:px-8">
    <div className="relative">
      <div className="rounded-[2rem] border-4 border-yellow-400 shadow-md overflow-hidden">
        <img
          src={userData.photoURL || "/default-avatar.png"}
          alt="Avatar"
          className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 object-cover"
        />
      </div>
      <button className="absolute bottom-2 right-2 bg-gradient-to-tr from-yellow-400 to-yellow-300 text-white p-2 rounded-full shadow-md hover:scale-105 transition">
        <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>

    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mt-4">
      {userData.displayName || "Snap User"}
    </h2>
    <p className="text-gray-500 text-sm sm:text-base">{userData.email}</p>

    {/* Stats */}
    <div className="flex flex-col sm:flex-row justify-center gap-6 mt-6 w-full">
      <div className="flex-1 text-center">
        <div className="bg-orange-50 rounded-xl p-3 inline-block">
          <Flame className="w-6 h-6 text-orange-500 mx-auto" />
        </div>
        <p className="text-sm text-gray-500 mt-1">Streak</p>
        <p className="font-semibold text-lg">{userData.snapStreak || 0}</p>
      </div>
      <div className="flex-1 text-center">
        <div className="bg-blue-50 rounded-xl p-3 inline-block">
          <Users className="w-6 h-6 text-blue-500 mx-auto" />
        </div>
        <p className="text-sm text-gray-500 mt-1">Friends</p>
        <p className="font-semibold text-lg">{userData.friendsCount || 0}</p>
      </div>
    </div>
  </div>

  {/* Actions */}
  <div className="max-w-3xl mx-auto mt-8 px-4 sm:px-6 md:px-8 space-y-3">
    <Link
      to="/settings"
      className="block w-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-white text-center py-3 rounded-2xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition"
    >
      Edit Profile
    </Link>

    <button className="w-full bg-gray-100 text-gray-800 py-3 rounded-2xl font-medium hover:bg-gray-200 hover:scale-[1.01] transition">
      View My Story
    </button>
    <button className="w-full bg-gray-100 text-gray-800 py-3 rounded-2xl font-medium hover:bg-gray-200 hover:scale-[1.01] transition">
      Add Friends
    </button>
  </div>
</div>

  );
}
