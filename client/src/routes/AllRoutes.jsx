import { useRoutes } from "react-router-dom";
import DefaultLayout from "../layouts/default";
import ChatLayout from "../layouts/chatLayout";
import Login from "../pages/Login";
import SignupPage from "../pages/Signup";
import ProfilePage from "../pages/Profile";
import SettingsPage from "../pages/Settings";
import Home from "../pages/Home";
import Chat from "../pages/Chat";
const routes = [
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { path: "/", element: <Home /> }, // route mặc định của layout
      { path: "profile", element: <ProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  {
    path: "/chat",
    element: <ChatLayout />,
    children: [
      {
        path: "",
        element: <Chat />,
      },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <SignupPage /> },
];

export default function AllRoutes() {
  const elements = useRoutes(routes);
  return elements;
}
