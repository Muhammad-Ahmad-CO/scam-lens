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
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <img
          src={imgSrc}
          alt="Diagram showing how this scam tries to trick a victim, step by step"
          className="w-full rounded-lg"
        />
        <p className="mt-2 text-sm text-gray-500">
          How this scam tries to trick you — generated visual.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={draw}
        disabled={busy}
        className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-800 hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Drawing the scam anatomy…" : "See how this scam works"}
      </button>
    </div>
  );
}
