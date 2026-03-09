import { createContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const nextSocket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"]
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, [isAuthenticated]);

  const value = useMemo(() => ({ socket }), [socket]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}