import { Server as SocketServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketServer | null = null;

function updatePresenceCount(socketIo: SocketServer, listingId: string) {
  const room = `listing:${listingId}`;
  const roomSockets = socketIo.sockets.adapter.rooms.get(room);
  const count = roomSockets?.size ?? 0;
  socketIo.to(room).emit("presence:count", { listingId, count });
}

export function initSocketServer(httpServer: HTTPServer): SocketServer {
  const socketIo = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  (global as unknown as Record<string, unknown>).__socketIO = socketIo;
  io = socketIo;

  socketIo.on("connection", (socket) => {
    socket.on("join_listing", ({ listingId }: { listingId: string }) => {
      socket.join(`listing:${listingId}`);
      updatePresenceCount(socketIo, listingId);
    });

    socket.on("leave_listing", ({ listingId }: { listingId: string }) => {
      socket.leave(`listing:${listingId}`);
      updatePresenceCount(socketIo, listingId);
    });

    socket.on("disconnect", () => {
      // Socket.io handles room cleanup automatically
    });
  });

  // Broadcast presence counts every 30 seconds
  setInterval(() => {
    socketIo.sockets.adapter.rooms.forEach((sockets, room) => {
      if (room.startsWith("listing:")) {
        const listingId = room.replace("listing:", "");
        socketIo.to(room).emit("presence:count", {
          listingId,
          count: sockets.size,
        });
      }
    });
  }, 30000);

  return socketIo;
}

export function getSocketIO(): SocketServer | null {
  return (
    io ??
    ((global as unknown as Record<string, unknown>).__socketIO as SocketServer | null) ??
    null
  );
}

export function emitToListing(listingId: string, event: string, data: unknown) {
  const socketIo = getSocketIO();
  if (socketIo) {
    socketIo.to(`listing:${listingId}`).emit(event, data);
  }
}
