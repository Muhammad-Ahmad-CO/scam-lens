"use client";

import type { DisplayVerdict } from "../lib/verdict";

const LEVEL_STYLES: Record<DisplayVerdict["level"], string> = {
  red: "border-red-300 bg-red-50 text-red-900",
  amber: "border-amber-300 bg-amber-50 text-amber-900",
  grey: "border-gray-300 bg-gray-100 text-gray-800",
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

  return (
    <div className={`mt-6 rounded-xl border p-5 ${style}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        Verdict
      </p>
      <h2 className="mt-1 text-2xl font-bold">{verdict.title}</h2>
      <p className="mt-1 text-sm opacity-80">{verdict.description}</p>

      <p className="mt-4 text-sm leading-relaxed">{explanation}</p>

      <div className="mt-4 rounded-lg bg-white/70 p-4">
        <h3 className="text-sm font-semibold">What to do</h3>
        <p className="mt-1 text-sm">{safeAction}</p>
      </div>

      <p className="mt-4 text-xs opacity-70">
        ScamLens never says a message is safe — when unsure, it says it
        can&apos;t verify.
      </p>
    </div>
  );
}
