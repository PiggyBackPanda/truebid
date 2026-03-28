"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface ViewToggleProps {
  currentView: "list" | "map";
}

export function ViewToggle({ currentView }: ViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchView(view: "list" | "map") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "list") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const qs = params.toString();
    router.push(qs ? `/listings?${qs}` : "/listings");
  }

  return (
    <div className="inline-flex items-center rounded-[10px] border border-border bg-white p-0.5 gap-0.5">
      <button
        type="button"
        onClick={() => switchView("list")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors ${
          currentView === "list"
            ? "bg-navy text-white"
            : "text-text-muted hover:text-text"
        }`}
        aria-pressed={currentView === "list"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        List
      </button>
      <button
        type="button"
        onClick={() => switchView("map")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors ${
          currentView === "map"
            ? "bg-navy text-white"
            : "text-text-muted hover:text-text"
        }`}
        aria-pressed={currentView === "map"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
        Map
      </button>
    </div>
  );
}
