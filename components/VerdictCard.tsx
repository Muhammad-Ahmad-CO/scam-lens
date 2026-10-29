"use client";

import type { DisplayVerdict } from "../lib/verdict";

const LEVEL_STYLES: Record<DisplayVerdict["level"], string> = {
  red: "border-danger/50 bg-danger/10",
  amber: "border-brand/50 bg-brand/10",
  grey: "border-white/15 bg-white/5",
};

const LEVEL_ACCENT: Record<DisplayVerdict["level"], string> = {
  red: "text-[#ff8589]",
  amber: "text-brand",
  grey: "text-slate-300",
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
  const style = LEVEL_STYLES[verdict.level] ?? LEVEL_STYLES.amber;
  const accent = LEVEL_ACCENT[verdict.level] ?? LEVEL_ACCENT.amber;

  return (
    <div className={`mt-6 rounded-2xl border p-6 md:p-7 ${style}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Verdict
      </p>
      <h2 className={`mt-2 font-display text-3xl font-bold ${accent}`}>
        {verdict.title}
      </h2>
      <p className="mt-1 text-sm text-slate-300">{verdict.description}</p>

      <p className="mt-4 leading-relaxed text-slate-200">{explanation}</p>

      <div className="mt-5 rounded-xl border border-white/10 bg-ink/70 p-4">
        <h3 className="text-sm font-semibold text-white">What to do</h3>
        <p className="mt-1 text-sm text-slate-300">{safeAction}</p>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        ScamLens never says a message is safe — when unsure, it says it
        can&apos;t verify.
      </p>
    </div>
  );
}
