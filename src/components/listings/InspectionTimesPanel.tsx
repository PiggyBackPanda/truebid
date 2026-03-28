"use client";

interface InspectionTime {
  date: string;
  startTime: string;
  endTime: string;
}

interface InspectionTimesPanelProps {
  times: InspectionTime[];
  address: string;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")}${ampm}`;
}

function formatDateLabel(dateStr: string): string {
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const weekday = d.toLocaleDateString("en-AU", { weekday: "long" });
  const dayNum = d.getDate();
  const monthName = d.toLocaleDateString("en-AU", { month: "long" });
  return `${weekday} ${dayNum} ${monthName}`;
}

function downloadIcs(slot: InspectionTime, address: string) {
  const [year, month, day] = slot.date.split("-");
  const [sh, sm] = slot.startTime.split(":");
  const [eh, em] = slot.endTime.split(":");
  const dtStart = `${year}${month}${day}T${sh}${sm}00`;
  const dtEnd = `${year}${month}${day}T${eh}${em}00`;
  const uid = `truebid-oi-${slot.date}-${slot.startTime.replace(":", "")}@truebid.com.au`;
  const dateLabel = formatDateLabel(slot.date);
  const startLabel = formatTime12h(slot.startTime);
  const endLabel = formatTime12h(slot.endTime);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TrueBid//TrueBid//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART;TZID=Australia/Perth:${dtStart}`,
    `DTEND;TZID=Australia/Perth:${dtEnd}`,
    `SUMMARY:Open for Inspection - ${address}`,
    `LOCATION:${address}`,
    `DESCRIPTION:Open for Inspection at ${address}\\n${dateLabel}\\, ${startLabel} – ${endLabel}`,
    `UID:${uid}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inspection-${slot.date}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function InspectionTimesPanel({ times, address }: InspectionTimesPanelProps) {
  if (times.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-navy mb-3">Open for Inspection</h2>
      <div className="bg-white border border-border rounded-[12px] divide-y divide-border overflow-hidden">
        {times.map((slot, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-5 py-3">
            <span className="text-sm text-text">
              {formatDateLabel(slot.date)},{" "}
              {formatTime12h(slot.startTime)} – {formatTime12h(slot.endTime)}
            </span>
            <button
              type="button"
              onClick={() => downloadIcs(slot, address)}
              className="text-xs text-slate hover:text-navy transition-colors flex items-center gap-1.5 shrink-0"
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Add to Calendar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
