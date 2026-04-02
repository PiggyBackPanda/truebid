"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation, type ConvMessage } from "@/hooks/useConversation";
import { formatCurrency, formatDateTime } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversationSummary = {
  id: string;
  createdAt: string;
  listing: { id: string; streetAddress: string; address: string };
  offer: { amountCents: number };
  other: { id: string; firstName: string; lastName: string };
  lastMessage: { body: string; sentAt: string; isFromMe: boolean } | null;
  unreadCount: number;
};

type ConversationDetail = {
  id: string;
  listing: { id: string; streetAddress: string; address: string };
  offer: { id: string; amountCents: number; conditionType: string; settlementDays: number };
  other: { id: string; firstName: string; lastName: string };
  buyer: { id: string; firstName: string; lastName: string };
  seller: { id: string; firstName: string; lastName: string };
};

type Props = {
  currentUserId: string;
  initialConversations: ConversationSummary[];
  initialConversationId: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 2) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d}d ago`;
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full bg-navy text-white font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35, fontFamily: "var(--font-sans)" }}
    >
      {initials}
    </div>
  );
}

// ─── Left panel: conversation list ────────────────────────────────────────────

function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p
          className="text-navy mb-2"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 18 }}
        >
          No conversations yet
        </p>
        <p className="text-text-muted text-sm font-sans leading-relaxed">
          Conversations open when a seller chooses to share contact details with a buyer.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId;
        const name = `${conv.other.firstName} ${conv.other.lastName}`;
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className="w-full text-left flex gap-3 items-start p-4 border-b border-border transition-colors"
            style={{
              background: isSelected ? "#f0f4ff" : "#ffffff",
              borderLeft: `3px solid ${isSelected ? "#0f1623" : "transparent"}`,
            }}
          >
            <Avatar name={name} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <p
                  className="font-semibold text-navy text-sm truncate"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {name}
                </p>
                <span className="text-text-light text-xs shrink-0 ml-2">
                  {conv.lastMessage ? timeAgo(conv.lastMessage.sentAt) : ""}
                </span>
              </div>
              <p
                className="text-xs text-text-muted truncate mb-1"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {conv.listing.streetAddress}
              </p>
              <div className="flex items-center justify-between">
                <p
                  className="text-xs text-text-muted truncate max-w-[160px]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {conv.lastMessage
                    ? `${conv.lastMessage.isFromMe ? "You: " : ""}${conv.lastMessage.body}`
                    : "No messages yet"}
                </p>
                {conv.unreadCount > 0 && (
                  <span
                    className="ml-2 shrink-0 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{
                      background: "#f59e0b",
                      color: "#1a0f00",
                      minWidth: 18,
                      height: 18,
                      padding: "0 5px",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Right panel: message thread ──────────────────────────────────────────────

function MessageThread({
  currentUserId,
  conversationId,
  summary,
}: {
  currentUserId: string;
  conversationId: string;
  summary: ConversationSummary;
}) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [historicMessages, setHistoricMessages] = useState<ConvMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    liveMessages,
    isOtherTyping,
    handleTypingInput,
    stopTyping,
    addOptimisticMessage,
    clearLiveMessages,
  } = useConversation(conversationId, currentUserId);

  // Load conversation detail + message history
  useEffect(() => {
    setLoading(true);
    clearLiveMessages();
    setHistoricMessages([]);
    setDraft("");

    fetch(`/api/conversations/${conversationId}`)
      .then((r) => r.json())
      .then(
        (data: {
          conversation: ConversationDetail;
          messages: ConvMessage[];
        }) => {
          setDetail(data.conversation);
          setHistoricMessages(data.messages ?? []);
        }
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historicMessages, liveMessages, isOtherTyping]);

  const allMessages = [...historicMessages, ...liveMessages];

  async function handleSend() {
    if (!draft.trim() || sending) return;
    const body = draft.trim();
    setDraft("");
    setSendError("");
    stopTyping();
    setSending(true);

    // Optimistic update
    const optimisticId = `optimistic-${Date.now()}`;
    addOptimisticMessage({
      id: optimisticId,
      senderId: currentUserId,
      body,
      sentAt: new Date().toISOString(),
      readAt: null,
    });

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setSendError(data.error ?? "Failed to send message.");
      }
    } catch {
      setSendError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleExport() {
    window.open(`/api/conversations/${conversationId}/export`, "_blank");
  }

  const otherName = `${summary.other.firstName} ${summary.other.lastName}`;

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b border-border bg-white shrink-0"
        style={{ minHeight: 64 }}
      >
        <Avatar name={otherName} />
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-navy text-sm"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {otherName}
          </p>
          <p className="text-xs text-text-muted font-sans truncate">
            {summary.listing.address}
            {" · "}
            <span className="text-text-light">
              Offer: {formatCurrency(summary.offer.amountCents)}
            </span>
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-medium text-slate border border-border rounded-lg px-3 py-2 hover:bg-bg transition-colors shrink-0"
          style={{ fontFamily: "var(--font-sans)" }}
          title="Download conversation transcript"
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6.5 1v8M3 6l3.5 3.5L10 6M1 11h11" />
          </svg>
          Transcript
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-text-muted text-sm font-sans">Loading…</p>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <p
              className="text-navy mb-2"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 18 }}
            >
              Start the conversation
            </p>
            <p className="text-text-muted text-sm font-sans max-w-xs leading-relaxed">
              Send a message to {summary.other.firstName} to get started.
              Messages are stored for your reference only. They do not constitute a legal agreement.
              All binding terms must be agreed in a formal contract of sale prepared by a licensed
              settlement agent or solicitor.
            </p>
          </div>
        ) : (
          allMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    background: isMe ? "#0f1623" : "#f3f4f6",
                    color: isMe ? "#ffffff" : "#0f1623",
                    borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    padding: "10px 14px",
                  }}
                >
                  {!isMe && detail && (
                    <p
                      className="font-semibold mb-1"
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {msg.senderId === detail.buyer.id
                        ? `${detail.buyer.firstName} ${detail.buyer.lastName}`
                        : `${detail.seller.firstName} ${detail.seller.lastName}`}
                    </p>
                  )}
                  <p
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: "var(--font-sans)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {msg.body}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      color: isMe ? "rgba(255,255,255,0.55)" : "#9ca3af",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {formatDateTime(msg.sentAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="flex justify-start">
            <div
              style={{
                background: "#f3f4f6",
                borderRadius: "12px 12px 12px 2px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#9ca3af",
                    display: "inline-block",
                    animation: `pulseDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-white p-3">
        {sendError && (
          <p className="text-red text-xs font-sans mb-2 px-1">{sendError}</p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              handleTypingInput();
            }}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none border border-border rounded-lg px-3 py-2.5 text-sm font-sans text-text outline-none focus:border-sky focus:ring-2 focus:ring-sky/20 transition-colors"
            style={{
              minHeight: 40,
              maxHeight: 120,
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            style={{
              background: draft.trim() && !sending ? "#0f1623" : "#e5e2db",
              cursor: draft.trim() && !sending ? "pointer" : "not-allowed",
              fontFamily: "var(--font-sans)",
              height: 40,
            }}
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MessagesPageClient({
  currentUserId,
  initialConversations,
  initialConversationId,
}: Props) {
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversationId ?? initialConversations[0]?.id ?? null
  );

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      // Clear unread count locally when opening a conversation
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    },
    []
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div>
      {/* Page header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1
            className="text-navy mb-1.5"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 32,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            Messages
          </h1>
          <p className="text-text-muted text-sm font-sans">
            Secure conversations between buyers and sellers to exchange contact details.
          </p>
        </div>
        {totalUnread > 0 && (
          <span
            className="text-xs font-bold rounded-full px-3 py-1"
            style={{
              background: "#fffbeb",
              color: "#d97706",
              fontFamily: "var(--font-sans)",
            }}
          >
            {totalUnread} unread
          </span>
        )}
      </div>

      {/* Two-panel layout */}
      <div
        className="border border-border rounded-lg overflow-hidden bg-white"
        style={{
          display: "grid",
          gridTemplateColumns: conversations.length === 0 ? "1fr" : "300px 1fr",
          height: "calc(100vh - 220px)",
          minHeight: 480,
          boxShadow: "0 1px 3px rgba(15,22,35,0.06), 0 4px 12px rgba(15,22,35,0.04)",
        }}
      >
        {/* Left panel */}
        {conversations.length > 0 && (
          <div className="flex flex-col border-r border-border">
            <div className="px-4 py-3 border-b border-border bg-bg shrink-0">
              <p
                className="text-xs font-semibold text-text-muted uppercase tracking-wider"
                style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.08em" }}
              >
                Conversations ({conversations.length})
              </p>
            </div>
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
        )}

        {/* Right panel */}
        {selectedConv ? (
          <MessageThread
            key={selectedConv.id}
            currentUserId={currentUserId}
            conversationId={selectedConv.id}
            summary={selectedConv}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div
              className="w-14 h-14 rounded-full bg-bg flex items-center justify-center mb-4"
            >
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.5"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p
              className="text-navy mb-2"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 18 }}
            >
              {conversations.length === 0
                ? "No conversations yet"
                : "Select a conversation"}
            </p>
            <p className="text-text-muted text-sm font-sans max-w-xs leading-relaxed">
              {conversations.length === 0
                ? "Conversations open when a seller chooses to share contact details with a buyer."
                : "Choose a conversation from the left panel to view messages."}
            </p>
          </div>
        )}
      </div>

      {/* Typing animation CSS */}
      <style>{`
        @keyframes pulseDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
