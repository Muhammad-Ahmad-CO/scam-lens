"use client";

import { useRef, useState } from "react";
import type { AnalyzeResult } from "../lib/verdict";

interface Props {
  onResult: (r: AnalyzeResult) => void;
  onError: (msg: string) => void;
  onStart: () => void;
}

const MAX_EDGE = 1600; // downscale long edge to 1600px

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.readAsDataURL(file);
  });
}

/** Downscale client-side via canvas so uploads stay small. */
async function downscaleToJpeg(
  dataUrl: string
): Promise<{ base64: string; mimeType: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not read the photo."));
    el.src = dataUrl;
  });
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("This browser cannot process photos.");
  }
  ctx.drawImage(img, 0, 0, w, h);
  const out = canvas.toDataURL("image/jpeg", 0.85);
  const parts = out.split(",", 2);
  if (parts.length !== 2 || !parts[1]) {
    throw new Error("Could not read the photo.");
  }
  return { base64: parts[1], mimeType: "image/jpeg" };
}

export default function PhotoInput({ onResult, onError, onStart }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    onStart();
    if (!file.type.startsWith("image/")) {
      onError("Please choose a photo file.");
      return;
    }
    setBusy("Reading photo…");
    try {
      const dataUrl = await readAsDataUrl(file);
      const { base64, mimeType } = await downscaleToJpeg(dataUrl);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType: "photo", imageBase64: base64, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Photo analysis failed."
        );
      }
      onResult({
        verdict: data.verdict,
        signals: Array.isArray(data.signals) ? data.signals : [],
        explanation_en:
          typeof data.explanation_en === "string" ? data.explanation_en : "",
        safe_action: typeof data.safe_action === "string" ? data.safe_action : "",
        source_text: typeof data.source_text === "string" ? data.source_text : "",
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="text-sm font-medium text-gray-700">
        Screenshot of the message
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy !== null}
        className="mt-2 block w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600 hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ?? "Tap to choose a photo of the SMS"}
      </button>
      <p className="mt-3 text-xs text-gray-500">
        Spark vision reads the text from your screenshot, then runs the same
        scam check.
      </p>
    </div>
  );
}
