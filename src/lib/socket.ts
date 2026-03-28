import { Server as SocketServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { decode } from "next-auth/jwt";
import { prisma } from "./db";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

let io: SocketServer | null = null;

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key.trim(), decodeURIComponent(val.join("="))];
    })
  );
}

function updatePresenceCount(socketIo: SocketServer, listingId: string) {
  const room = `listing:${listingId}`;
  const roomSockets = socketIo.sockets.adapter.rooms.get(room);
  const count = roomSockets?.size ?? 0;
  socketIo.to(room).emit("presence:count", { listingId, count });
}

export function initSocketServer(httpServer: HTTPServer): SocketServer {
  const socketIo = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  // ── Redis adapter (multi-instance support) ───────────────────────────────
  // Attach when REDIS_URL is set (production / staging).
  // Falls back to the default in-memory adapter in local dev.
  if (process.env.REDIS_URL) {
    try {
      const pubClient = new Redis(process.env.REDIS_URL);
      const subClient = pubClient.duplicate();
      socketIo.adapter(createAdapter(pubClient, subClient));
      console.log("[socket.io] Redis adapter attached");
    } catch (err) {
      console.error("[socket.io] Failed to attach Redis adapter, falling back to in-memory", err);
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn(
      "[socket.io] REDIS_URL not set in production. Socket.io running with in-memory adapter. " +
        "Real-time events will not propagate across multiple server instances."
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  (global as unknown as Record<string, unknown>).__socketIO = socketIo;
  io = socketIo;

  socketIo.on("connection", async (socket) => {
    // ── Authenticate the connection ───────────────────────────────────────────
    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const cookies = parseCookies(cookieHeader);
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "";
    const tokenCookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";

    const rawToken = cookies[tokenCookieName];
    if (!rawToken) {
      socket.disconnect(true);
      return;
    }

    const decoded = await decode({ token: rawToken, secret });
    const userId = decoded?.id as string | undefined;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.data.userId = userId;
    // ─────────────────────────────────────────────────────────────────────────

    socket.on("join_listing", ({ listingId }: { listingId: string }) => {
      socket.join(`listing:${listingId}`);
      updatePresenceCount(socketIo, listingId);
    });

    socket.on("leave_listing", ({ listingId }: { listingId: string }) => {
      socket.leave(`listing:${listingId}`);
      updatePresenceCount(socketIo, listingId);
    });

    // ── Conversation rooms ─────────────────────────────────────────────────────
    socket.on(
      "join_conversation",
      async ({ conversationId }: { conversationId: string }) => {
        const uid = socket.data.userId as string;
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { buyerId: true, sellerId: true },
        });
        if (!conv || (conv.buyerId !== uid && conv.sellerId !== uid)) {
          return; // silently ignore: user is not a party
        }
        socket.join(`conversation:${conversationId}`);
      }
    );

    socket.on(
      "leave_conversation",
      ({ conversationId }: { conversationId: string }) => {
        socket.leave(`conversation:${conversationId}`);
      }
    );

    socket.on(
      "typing:start",
      ({ conversationId }: { conversationId: string }) => {
        socket
          .to(`conversation:${conversationId}`)
          .emit("typing:start", { socketId: socket.id });
      }
    );

    socket.on(
      "typing:stop",
      ({ conversationId }: { conversationId: string }) => {
        socket
          .to(`conversation:${conversationId}`)
          .emit("typing:stop", { socketId: socket.id });
      }
    );

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

export function emitToConversation(
  conversationId: string,
  event: string,
  data: unknown
) {
  const socketIo = getSocketIO();
  if (socketIo) {
    socketIo.to(`conversation:${conversationId}`).emit(event, data);
  }
}
