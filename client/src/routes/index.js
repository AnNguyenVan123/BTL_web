import React from "react"

import DefaultLayout from "../layouts/default"
import Login from "../pages/Login";

export const routes = [
  {
    path: "/",
    element: React.createElement(DefaultLayout),
    children: [
      {
        path: "login",
        element: React.createElement(Login)
      }
    ]
  }
]