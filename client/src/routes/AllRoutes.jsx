import { useRoutes } from "react-router-dom";
import React from "react"
import DefaultLayout from "../layouts/default"
import Login from "../pages/Login";
import SignupPage from "../pages/SignUp";
const routes = [
  {
    path: "/",
    element: React.createElement(DefaultLayout),
    children: [
      // các route khác trong layout
    ],
  },
  {
    path: "/login",
    element: React.createElement(Login),
  },
  {
    path: "/signup",
    element: React.createElement(SignupPage),
  },
];
export default function AllRoutes() {
  const elements = useRoutes(routes);
  return (
    elements
  )
}