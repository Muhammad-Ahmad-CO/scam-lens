"use client";

import type { DisplayVerdict } from "../lib/verdict";

const LEVEL_STAMP: Record<DisplayVerdict["level"], string> = {
  red: "border-danger text-danger",
  amber: "border-brand text-brand",
  grey: "border-slate-400 text-slate-200",
};

const LEVEL_PANEL: Record<DisplayVerdict["level"], string> = {
  red: "border-danger/40",
  amber: "border-brand/40",
  grey: "border-white/15",
};

export default function VerdictCard({
  verdict,
  explanation,
  safeAction,
}: {
  verdict: DisplayVerdict;
  explanation: string;
  safeAction: string;
}) {
  const stamp = LEVEL_STAMP[verdict.level] ?? LEVEL_STAMP.amber;
  const panel = LEVEL_PANEL[verdict.level] ?? LEVEL_PANEL.amber;

  return (
    <div className={`mt-6 rounded-md border bg-ink p-5 ${panel}`}>
      <p className="font-mono text-[11px] tracking-widest text-slate-500">
        VERDICT
      </p>
      <div className="mt-3">
        <span
          className={`inline-block -rotate-2 border-[3px] px-3 py-1 font-display text-2xl font-bold uppercase tracking-[0.15em] ${stamp}`}
        >
          {verdict.title}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-300">{verdict.description}</p>

      <p className="mt-4 leading-relaxed text-slate-200">{explanation}</p>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="font-mono text-[11px] tracking-widest text-slate-500">
          WHAT TO DO
        </p>
        <p className="mt-2 text-sm text-slate-200">{safeAction}</p>
      </div>

      <p className="mt-4 font-mono text-[11px] leading-relaxed text-slate-500">
        ScamLens never says a message is safe — when unsure, it says it
        can&apos;t verify.
      </p>
    </div>
  );
}
