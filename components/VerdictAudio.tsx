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
    <div className="mt-6 rounded-md border border-white/10 bg-ink p-5">
      <p className="font-mono text-[11px] tracking-widest text-slate-500">
        PLAYBACK — HEAR THE VERDICT
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label htmlFor="voice-lang" className="font-mono text-xs text-slate-500">
          VOICE /
        </label>
        <select
          id="voice-lang"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="rounded-md border border-white/15 bg-panel p-2 text-sm text-slate-200"
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
          className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-[#E85A45] disabled:cursor-not-allowed disabled:bg-slate-700/70 disabled:text-slate-400"
        >
          {busy ? "Loading…" : "Listen to verdict"}
        </button>
      </div>
      {status && <p className="mt-3 text-sm text-slate-300">{status}</p>}
      <p className="mt-2 font-mono text-[11px] text-slate-600">
        The written verdict never changes — only the spoken voice does.
      </p>
    </div>
  );
}
