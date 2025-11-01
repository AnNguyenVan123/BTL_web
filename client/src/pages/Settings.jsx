import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  ChevronRight,
  User,
  Bell,
  Lock,
  Shield,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <p className="text-center mt-10">⚠️ Bạn chưa đăng nhập.</p>;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = [
    { icon: <User className="w-5 h-5" />, label: "Edit Profile", path: "/edit-profile" },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", path: "/notifications" },
    { icon: <Lock className="w-5 h-5" />, label: "Privacy", path: "/privacy" },
    { icon: <Shield className="w-5 h-5" />, label: "Security", path: "/security" },
    { icon: <HelpCircle className="w-5 h-5" />, label: "Help Center", path: "/help" },
  ];

  return (
<div className="min-h-screen bg-[#fffefb] text-gray-800">
  <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
    <div className="max-w-3xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 py-4">
      <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition">
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
      </button>

      <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Settings</h1>

      <Link to="/" className="p-2 rounded-full text-yellow-500 font-semibold hover:text-yellow-600 transition">
        Done
      </Link>
    </div>
  </div>

  {/* User Info */}
  <div className="max-w-3xl mx-auto p-4 sm:p-5 border-b border-gray-100 flex items-center gap-4">
    <img
      src={user.photoURL || "/default-avatar.png"}
      alt="avatar"
      className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl object-cover border border-gray-200 shadow-sm"
    />
    <div>
      <p className="font-semibold text-lg sm:text-xl">{user.displayName || "Snap User"}</p>
      <p className="text-gray-500 text-sm sm:text-base">{user.email}</p>
    </div>
  </div>

  {/* Menu Items */}
  <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-3">
    {menuItems.map((item, i) => (
      <Link
        key={i}
        to={item.path}
        className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-transform duration-150 hover:scale-[1.01]"
      >
        <div className="flex items-center gap-3 text-gray-700">
          <div className="bg-yellow-50 text-yellow-500 p-2 rounded-xl">
            {item.icon}
          </div>
          <span className="font-medium text-sm sm:text-base">{item.label}</span>
        </div>
        <ChevronRight className="text-gray-400 w-5 h-5 sm:w-6 sm:h-6" />
      </Link>
    ))}
  </div>

  {/* Logout */}
  <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-2xl font-semibold hover:bg-red-100 hover:scale-[1.02] transition"
    >
      <LogOut className="w-5 h-5 sm:w-6 sm:h-6" /> Log Out
    </button>
  </div>
</div>

  );
}
