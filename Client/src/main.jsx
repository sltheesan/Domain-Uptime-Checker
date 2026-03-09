import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { router } from "./app/router";
import "./index.css";

function Providers() {
  return (
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Providers />
  </React.StrictMode>
);