import { Server } from "socket.io";

let ioInstance = null;

export const initSocketServer = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  });

  ioInstance.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join-brand-room", (brandId) => {
      if (brandId) {
        socket.join(`brand:${brandId}`);
      }
    });

    socket.on("leave-brand-room", (brandId) => {
      if (brandId) {
        socket.leave(`brand:${brandId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io is not initialized.");
  }

  return ioInstance;
};

export const emitDashboardUpdated = (payload) => {
  if (!ioInstance) return;
  ioInstance.emit("dashboard:updated", payload);
};

export const emitBrandUpdated = (brandId, payload) => {
  if (!ioInstance || !brandId) return;
  ioInstance.to(`brand:${brandId}`).emit("brand:updated", payload);
};