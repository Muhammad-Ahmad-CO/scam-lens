"use client";

import { useRef, useState } from "react";
import { fileToWav16kMono } from "../lib/audio-convert";
import type { AnalyzeResult } from "../lib/verdict";

interface Props {
  onResult: (r: AnalyzeResult) => void;
  onError: (msg: string) => void;
  onStart: () => void;
}

export default function VoiceInput({ onResult, onError, onStart }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    onStart();
    if (!file.type.startsWith("audio/")) {
      onError("Please choose a voice-note audio file.");
      return;
    }
    try {
      // Step 1: convert to 16 kHz mono WAV on the device (no server ffmpeg).
      setBusy("Converting voice note…");
      const { base64 } = await fileToWav16kMono(file);
      // Step 2: transcribe, then the same scam pipeline.
      setBusy("Transcribing…");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputType: "voice",
          audioBase64: base64,
          mimeType: "audio/wav",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Voice analysis failed."
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
      <span className="text-sm font-medium text-slate-300">
        Voice note file
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy !== null}
        className="mt-2 block w-full rounded-xl border border-dashed border-white/20 bg-ink p-6 text-center text-sm text-slate-400 transition-colors hover:border-brand/60 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ?? "Tap to choose a voice note file (no live mic)"}
      </button>
      <p className="mt-3 text-xs text-slate-500">
        The voice note is converted on your device, transcribed, then checked
        like a text message.
      </p>
    </div>
  );
}
