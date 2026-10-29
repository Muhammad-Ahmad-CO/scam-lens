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
  fake_sender: "bg-danger/25 text-red-100 border-danger/60",
  urgency_threat: "bg-brand/20 text-amber-100 border-brand/60",
  short_link: "bg-brand/20 text-amber-100 border-brand/60",
  otp_demand: "bg-danger/25 text-red-100 border-danger/60",
  prize_lure: "bg-brand/20 text-amber-100 border-brand/60",
  impersonation: "bg-danger/25 text-red-100 border-danger/60",
  off_platform_move: "bg-brand/20 text-amber-100 border-brand/60",
};

const FALLBACK_STYLE = "bg-brand/20 text-amber-100 border-brand/60";

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
        <span className="mr-1 inline-block rounded border border-white/15 bg-white/10 px-1 align-middle text-[10px] font-semibold uppercase tracking-wide text-slate-300">
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
      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-300">
        {kept.length > 0 ? "Traps found in your message" : "Your message"}
      </h3>
      <p className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-ink p-4 text-sm leading-relaxed text-slate-200">
        {parts.length > 0 ? parts : text}
      </p>
      {signals.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {signals.map((s, i) => (
            <li
              key={i}
              className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
            >
              <span className="font-semibold text-brand">
                {labelFor(s.type)}:
              </span>{" "}
              <span className="text-slate-300">{s.why}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
