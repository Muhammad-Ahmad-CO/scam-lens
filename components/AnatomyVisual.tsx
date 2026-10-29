"use client";

import { useState } from "react";

/**
 * "See how this scam works" button + explainer visual.
 * Rendered ONLY after a SUSPICIOUS (red) verdict.
 *
 * HONESTY RULE: if the image service is unavailable (503 imageUnavailable
 * or any error), this component hides itself completely — it renders null.
 * Never a broken image icon, never a placeholder, never a fake visual.
 */
export default function AnatomyVisual({ signals }: { signals: string[] }) {
  const [busy, setBusy] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [gone, setGone] = useState(false);

  if (signals.length === 0 || gone) {
    return null;
  }

  async function draw() {
    // Runs only from the button tap below.
    setBusy(true);
    try {
      const res = await fetch("/api/anatomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signals }),
      });
      const data = await res.json();
      if (!res.ok || !data || typeof data.imageBase64 !== "string") {
        // 503 imageUnavailable lands here: hide, don't show an error box.
        setGone(true);
        return;
      }
      const mime =
        typeof data.mimeType === "string" ? data.mimeType : "image/png";
      setImgSrc(`data:${mime};base64,${data.imageBase64}`);
    } catch {
      // Network failure etc: hide, never a broken image.
      setGone(true);
    } finally {
      setBusy(false);
    }
  }

  if (imgSrc) {
    return (
      <div className="mt-6 rounded-md border border-white/10 bg-ink p-4">
        <p className="font-mono text-[11px] tracking-widest text-slate-500">
          EXHIBIT B — ANATOMY OF THE TRAP
        </p>
        <img
          src={imgSrc}
          alt="Diagram showing how this scam tries to trick a victim, step by step"
          className="mt-3 w-full rounded-md"
        />
        <p className="mt-3 font-mono text-[11px] text-slate-500">
          How this scam tries to trick you — generated visual.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button
        onClick={draw}
        disabled={busy}
        className="rounded-md border border-brand/50 px-5 py-2 font-mono text-xs tracking-wide text-brand transition-colors hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Drawing the scam anatomy…" : "SEE HOW THIS SCAM WORKS"}
      </button>
    </div>
  );
}
