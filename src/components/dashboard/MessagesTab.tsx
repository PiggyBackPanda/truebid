"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Conversation = {
  listingId: string;
  listingAddress: string;
  counterparty: {
    id: string;
    firstName: string;
    lastName: string;
    publicAlias: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  };
  unreadCount: number;
};

type ThreadMessage = {
  id: string;
  senderId: string;
  content: string;
  status: string;
  createdAt: string;
  isFromMe: boolean;
};

type CounterpartyOffer = {
  amountCents: number;
  conditionType: string;
} | null;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "#0f1623",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 600,
        flexShrink: 0,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

type Props = {
  listingId: string;
  currentUserId: string;
  initialConversations: Conversation[];
  openBuyerId?: string | null;
};

export function MessagesTab({
  listingId,
  currentUserId,
  initialConversations,
  openBuyerId,
}: Props) {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    openBuyerId ?? null
  );
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [counterpartyOffer, setCounterpartyOffer] =
    useState<CounterpartyOffer>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedConvo = conversations.find(
    (c) => c.counterparty.id === selectedUserId
  );

  useEffect(() => {
    if (openBuyerId) {
      setSelectedUserId(openBuyerId);
    }
  }, [openBuyerId]);

  useEffect(() => {
    if (!selectedUserId) return;
    setLoadingThread(true);

    fetch(`/api/messages/conversations/${listingId}/${selectedUserId}`)
      .then((r) => r.json())
      .then(
        (data: {
          messages: ThreadMessage[];
          counterpartyOffer: CounterpartyOffer;
        }) => {
          setMessages(data.messages ?? []);
          setCounterpartyOffer(data.counterpartyOffer);
          // Mark as read in conversation list
          setConversations((prev) =>
            prev.map((c) =>
              c.counterparty.id === selectedUserId
                ? { ...c, unreadCount: 0 }
                : c
            )
          );
        }
      )
      .catch(() => {})
      .finally(() => setLoadingThread(false));
  }, [selectedUserId, listingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!draftContent.trim() || !selectedUserId || sending) return;
    setSending(true);
    const content = draftContent.trim();
    setDraftContent("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selectedUserId,
          listingId,
          content,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        message: { id: string; createdAt: string; content: string };
      };
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          senderId: currentUserId,
          content,
          status: "SENT",
          createdAt: data.message.createdAt,
          isFromMe: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (conversations.length === 0) {
    return (
      <div
        style={{
          background: "#f9f8f6",
          border: "1px solid #e5e2db",
          borderRadius: 12,
          padding: "48px 32px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 20,
            color: "#0f1623",
            marginBottom: 8,
          }}
        >
          No messages yet
        </p>
        <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
          Buyers will be able to contact you directly through your listing.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: selectedUserId ? "300px 1fr" : "1fr",
        gap: 0,
        border: "1px solid #e5e2db",
        borderRadius: 12,
        overflow: "hidden",
        height: 520,
      }}
    >
      {/* Conversation list */}
      <div
        style={{
          borderRight: "1px solid #e5e2db",
          overflowY: "auto",
          display: selectedUserId ? undefined : "block",
        }}
      >
        {conversations.map((convo) => {
          const isSelected = convo.counterparty.id === selectedUserId;
          const name = `${convo.counterparty.firstName} ${convo.counterparty.lastName}`;
          return (
            <button
              key={convo.counterparty.id}
              onClick={() => setSelectedUserId(convo.counterparty.id)}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                width: "100%",
                padding: "16px",
                background: isSelected ? "#f0f4ff" : "#ffffff",
                borderBottom: "1px solid #e5e2db",
                cursor: "pointer",
                border: "none",
                textAlign: "left",
              }}
            >
              <Avatar name={name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 3,
                  }}
                >
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "#0f1623",
                      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    }}
                  >
                    {name}
                  </p>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    {timeAgo(convo.lastMessage.createdAt)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 160,
                      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    }}
                  >
                    {convo.lastMessage.isFromMe ? "You: " : ""}
                    {convo.lastMessage.content}
                  </p>
                  {convo.unreadCount > 0 && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#f59e0b",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Thread */}
      {selectedUserId && selectedConvo && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Thread header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e5e2db",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#ffffff",
            }}
          >
            <Avatar
              name={`${selectedConvo.counterparty.firstName} ${selectedConvo.counterparty.lastName}`}
            />
            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#0f1623",
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                {selectedConvo.counterparty.firstName} {selectedConvo.counterparty.lastName}
              </p>
            </div>
          </div>

          {/* Offer info bar */}
          {counterpartyOffer && (
            <div
              style={{
                background: "#fefce8",
                borderBottom: "1px solid #fef08a",
                padding: "8px 20px",
                fontSize: 13,
                color: "#854d0e",
              }}
            >
              This buyer has offered{" "}
              <strong>{formatCurrency(counterpartyOffer.amountCents)}</strong> (
              {counterpartyOffer.conditionType === "UNCONDITIONAL"
                ? "unconditional"
                : counterpartyOffer.conditionType.toLowerCase().replace(/_/g, " ")}
              )
            </div>
          )}

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {loadingThread ? (
              <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 40 }}>Loading…</p>
            ) : messages.length === 0 ? (
              <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 40 }}>
                No messages yet. Say hello!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: msg.isFromMe ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      background: msg.isFromMe ? "#0f1623" : "#f3f4f6",
                      color: msg.isFromMe ? "#ffffff" : "#0f1623",
                      borderRadius: msg.isFromMe
                        ? "12px 12px 2px 12px"
                        : "12px 12px 12px 2px",
                      padding: "10px 14px",
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    <p>{msg.content}</p>
                    <p
                      style={{
                        fontSize: 11,
                        marginTop: 4,
                        color: msg.isFromMe ? "rgba(255,255,255,0.6)" : "#9ca3af",
                      }}
                    >
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Message input */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #e5e2db",
              display: "flex",
              gap: 8,
              background: "#ffffff",
            }}
          >
            <input
              type="text"
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message…"
              style={{
                flex: 1,
                border: "1px solid #e5e2db",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 14,
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !draftContent.trim()}
              style={{
                background: draftContent.trim() ? "#0f1623" : "#e5e2db",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                cursor: draftContent.trim() ? "pointer" : "not-allowed",
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
