"use client";

import { useEffect, useState } from "react";
import {
  VOICE_LANGUAGES,
  hasVoiceFor,
  speak,
} from "../lib/device-voice";

/**
 * Spoken verdict player. TAP-ONLY: speech starts only when the user taps
 * "Listen to verdict". Never autoplays. The written verdict above never
 * changes — only the spoken language does.
 */
export default function VerdictAudio({
  explanationEn,
}: {
  explanationEn: string;
}) {
  const [lang, setLang] = useState("en");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // langCode -> true/false once known; missing key = not checked yet.
  const [voiceMap, setVoiceMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const update = () => {
      const m: Record<string, boolean> = {};
      for (const l of VOICE_LANGUAGES) {
        m[l.code] = hasVoiceFor(l.code);
      }
      setVoiceMap(m);
    };
    update();
    const s =
      typeof window !== "undefined" ? window.speechSynthesis : undefined;
    s?.addEventListener("voiceschanged", update);
    return () => s?.removeEventListener("voiceschanged", update);
  }, []);

  async function listen() {
    // Runs only from the button tap below. Never autoplay, never on mount.
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: explanationEn, targetLang: lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Translation failed."
        );
      }
      const r = speak(data.translated, lang);
      setStatus(r.message);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-panel p-5 md:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-300">
        Hear the verdict
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label htmlFor="voice-lang" className="text-sm text-slate-400">
          Listen in:
        </label>
        <select
          id="voice-lang"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="rounded-lg border border-white/15 bg-ink p-2 text-sm text-slate-200"
        >
          {VOICE_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {voiceMap[l.code] === false
                ? `${l.name} — no voice on this device`
                : l.name}
            </option>
          ))}
        </select>
        <button
          onClick={listen}
          disabled={busy}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-ink hover:bg-[#ffbe45] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Loading…" : "Listen to verdict"}
        </button>
      </div>
      {status && <p className="mt-3 text-sm text-slate-300">{status}</p>}
      <p className="mt-2 text-xs text-slate-500">
        The written verdict above never changes — only the spoken voice does.
      </p>
    </div>
  );
}
