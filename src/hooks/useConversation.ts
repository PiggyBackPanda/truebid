"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export type ConvMessage = {
  id: string;
  senderId: string;
  body: string;
  sentAt: string;
  readAt: string | null;
};

export function useConversation(
  conversationId: string | null,
  currentUserId: string
) {
  const [liveMessages, setLiveMessages] = useState<ConvMessage[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;

    if (conversationId) {
      socket.emit("join_conversation", { conversationId });

      socket.on("message:new", (msg: ConvMessage) => {
        // Only add if it came from the OTHER user (our own optimistic updates handle ours)
        if (msg.senderId !== currentUserId) {
          setLiveMessages((prev) => [...prev, msg]);
        }
      });

      socket.on("typing:start", () => {
        setIsOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        // Auto-clear after 4s in case typing:stop is missed
        typingTimeoutRef.current = setTimeout(
          () => setIsOtherTyping(false),
          4000
        );
      });

      socket.on("typing:stop", () => {
        setIsOtherTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      });
    }

    return () => {
      if (conversationId) {
        socket.emit("leave_conversation", { conversationId });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      socket.disconnect();
    };
  }, [conversationId, currentUserId]);

  function handleTypingInput() {
    if (!socketRef.current || !conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketRef.current.emit("typing:start", { conversationId });
    }

    // Stop typing after 1.5s of no input
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketRef.current?.emit("typing:stop", { conversationId });
    }, 1500);
  }

  function stopTyping() {
    if (!socketRef.current || !conversationId) return;
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketRef.current.emit("typing:stop", { conversationId });
    }
  }

  function addOptimisticMessage(msg: ConvMessage) {
    setLiveMessages((prev) => [...prev, msg]);
  }

  function clearLiveMessages() {
    setLiveMessages([]);
  }

  return {
    liveMessages,
    isOtherTyping,
    handleTypingInput,
    stopTyping,
    addOptimisticMessage,
    clearLiveMessages,
  };
}
