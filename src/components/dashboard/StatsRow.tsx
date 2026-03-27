"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Stats = {
  totalViews: number;
  totalViewsToday: number;
  totalSaves: number;
  totalSavesToday: number;
  activeOffers: number;
  highestOfferCents: number | null;
  unreadMessages: number;
  activeListings: number;
};

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
};

function StatCard({ label, value, sub, subColor = "#6b7280" }: StatCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e2db",
        borderRadius: 12,
        padding: "20px 24px",
      }}
    >
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 6, fontFamily: "Outfit, sans-serif" }}>
        {label}
      </p>
      <p
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#0f1a2e",
          fontFamily: "DM Serif Display, Georgia, serif",
          lineHeight: 1.1,
          marginBottom: 4,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, color: subColor, fontFamily: "Outfit, sans-serif" }}>{sub}</p>
    </div>
  );
}

export function StatsRow({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState<Stats>(initialStats);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/dashboard/seller/stats");
        if (!res.ok) return;
        const data = (await res.json()) as { stats: Stats };
        setStats(data.stats);
      } catch {
        // ignore
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}
    >
      <StatCard
        label="Total Views"
        value={stats.totalViews.toLocaleString()}
        sub={`+${stats.totalViewsToday} today`}
        subColor="#16a34a"
      />
      <StatCard
        label="Saves"
        value={stats.totalSaves.toLocaleString()}
        sub={`+${stats.totalSavesToday} today`}
        subColor="#16a34a"
      />
      <StatCard
        label="Active Offers"
        value={String(stats.activeOffers)}
        sub={
          stats.highestOfferCents !== null
            ? `Highest: ${formatCurrency(stats.highestOfferCents)}`
            : "No offers yet"
        }
      />
      <StatCard
        label="Unread Messages"
        value={String(stats.unreadMessages)}
        sub={stats.unreadMessages > 0 ? `${stats.unreadMessages} unread` : "All caught up"}
        subColor={stats.unreadMessages > 0 ? "#2563eb" : "#6b7280"}
      />
    </div>
  );
}
