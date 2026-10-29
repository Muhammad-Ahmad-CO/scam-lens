"use client";

import type { ReactNode } from "react";
import type { TrapSignal } from "../lib/verdict";

// Human-readable labels for the 7 signal taxonomy ids.
const TYPE_LABELS: Record<string, string> = {
  fake_sender: "Fake sender",
  urgency_threat: "Urgency",
  short_link: "Short link",
  otp_demand: "OTP demand",
  prize_lure: "Prize lure",
  impersonation: "Impersonation",
  off_platform_move: "Off-platform move",
};

// Two highlight colors: red for the most dangerous signals, amber for the rest.
const TYPE_STYLES: Record<string, string> = {
  fake_sender: "bg-red-100 text-red-900 border-red-300",
  urgency_threat: "bg-amber-100 text-amber-900 border-amber-300",
  short_link: "bg-amber-100 text-amber-900 border-amber-300",
  otp_demand: "bg-red-100 text-red-900 border-red-300",
  prize_lure: "bg-amber-100 text-amber-900 border-amber-300",
  impersonation: "bg-red-100 text-red-900 border-red-300",
  off_platform_move: "bg-amber-100 text-amber-900 border-amber-300",
};

const FALLBACK_STYLE = "bg-amber-100 text-amber-900 border-amber-300";

function labelFor(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

interface QuoteMatch {
  start: number;
  end: number;
  signal: TrapSignal;
}

export default function TrapHighlight({
  text,
  signals,
}: {
  text: string;
  signals: TrapSignal[];
}) {
  // Find each signal's exact quote in the text (case-insensitive).
  // Quotes that are not found are skipped gracefully.
  const lower = text.toLowerCase();
  const matches: QuoteMatch[] = [];
  for (const signal of signals) {
    const quote = (signal.quote ?? "").trim();
    if (!quote) continue;
    const idx = lower.indexOf(quote.toLowerCase());
    if (idx === -1) continue;
    matches.push({ start: idx, end: idx + quote.length, signal });
  }

  // Drop overlapping matches, keep the earliest one.
  matches.sort((a, b) => a.start - b.start);
  const kept: QuoteMatch[] = [];
  for (const m of matches) {
    if (kept.length === 0 || m.start >= kept[kept.length - 1].end) {
      kept.push(m);
    }
  }

  const parts: ReactNode[] = [];
  let pos = 0;
  kept.forEach((m, i) => {
    if (m.start > pos) {
      parts.push(<span key={`t${i}`}>{text.slice(pos, m.start)}</span>);
    }
    const style = TYPE_STYLES[m.signal.type] ?? FALLBACK_STYLE;
    parts.push(
      <span key={`s${i}`}>
        <span className="mr-1 inline-block rounded border border-gray-300 bg-gray-100 px-1 align-middle text-[10px] font-semibold uppercase tracking-wide text-gray-600">
          {labelFor(m.signal.type)}
        </span>
        <mark title={m.signal.why} className={`rounded border-b-2 px-0.5 ${style}`}>
          {text.slice(m.start, m.end)}
        </mark>
      </span>
    );
    pos = m.end;
  });
  if (pos < text.length) {
    parts.push(<span key="tail">{text.slice(pos)}</span>);
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700">
        {kept.length > 0 ? "Traps found in your message" : "Your message"}
      </h3>
      <p className="mt-2 whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
        {parts.length > 0 ? parts : text}
      </p>
      {signals.length > 0 && (
        <ul className="mt-3 space-y-2">
          {signals.map((s, i) => (
            <li key={i} className="text-sm">
              <span className="font-semibold text-gray-800">
                {labelFor(s.type)}:
              </span>{" "}
              <span className="text-gray-600">{s.why}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
