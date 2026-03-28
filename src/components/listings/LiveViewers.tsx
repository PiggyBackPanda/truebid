"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface Props {
  listingId: string;
}

export function LiveViewers({ listingId }: Props) {
  const [count, setCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_listing", { listingId });
    });

    socket.on("presence:count", ({ count: c }: { count: number }) => {
      setCount(c);
    });

    return () => {
      if (socket.connected) {
        socket.emit("leave_listing", { listingId });
      }
      socket.disconnect();
    };
  }, [listingId]);

  if (count < 2) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
      </span>
      <span className="text-sm text-text-muted">
        {count} people viewing this property right now
      </span>
    </div>
  );
}
