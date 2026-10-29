"use client";

import { useState } from "react";
import TrapHighlight from "../components/TrapHighlight";
import VerdictCard from "../components/VerdictCard";
import type { DisplayVerdict, TrapSignal } from "../lib/verdict";

type TabId = "text" | "photo" | "voice";

const TABS: { id: TabId; label: string }[] = [
  { id: "text", label: "Paste text" },
  { id: "photo", label: "Upload photo" },
  { id: "voice", label: "Upload voice note" },
];

interface AnalyzeResult {
  verdict: DisplayVerdict;
  signals: TrapSignal[];
  explanation_en: string;
  safe_action: string;
}

export default function Home() {
  const [tab, setTab] = useState<TabId>("text");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [checkedText, setCheckedText] = useState("");

  async function checkMessage() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType: "text", text }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Analysis failed."
        );
      }
      setCheckedText(text);
      setResult({
        verdict: data.verdict,
        signals: Array.isArray(data.signals) ? data.signals : [],
        explanation_en:
          typeof data.explanation_en === "string" ? data.explanation_en : "",
        safe_action:
          typeof data.safe_action === "string" ? data.safe_action : "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">ScamLens</h1>
      <p className="mt-2 text-gray-600">
        Paste any shady message — ScamLens shows you the traps and tells you
        what to do, in your own language.
      </p>

      <div className="mt-8 flex gap-2" role="tablist" aria-label="Input type">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={
              "rounded-full border px-4 py-2 text-sm font-medium " +
              (tab === t.id
                ? "border-black bg-black text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {tab === "text" && (
          <div>
            <label
              htmlFor="message"
              className="text-sm font-medium text-gray-700"
            >
              Suspicious message
            </label>
            <textarea
              id="message"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the SMS or WhatsApp message here…"
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm"
            />
            <button
              onClick={checkMessage}
              disabled={loading || !text.trim()}
              className="mt-3 rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Check message"}
            </button>
            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </p>
            )}
          </div>
        )}

        {tab === "photo" && (
          <div>
            <span className="text-sm font-medium text-gray-700">
              Screenshot of the message
            </span>
            <div className="mt-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Photo upload comes here.
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Day 3: Spark vision reads the SMS screenshot into text.
            </p>
          </div>
        )}

        {tab === "voice" && (
          <div>
            <span className="text-sm font-medium text-gray-700">
              Voice note file
            </span>
            <div className="mt-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Voice-note upload comes here (file only, no live mic).
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Day 3: the voice note is transcribed, then goes through the same
              pipeline.
            </p>
          </div>
        )}
      </div>

      <section className="mt-8">
        {result ? (
          <div>
            <TrapHighlight text={checkedText} signals={result.signals} />
            <VerdictCard
              verdict={result.verdict}
              explanation={result.explanation_en}
              safeAction={result.safe_action}
            />
          </div>
        ) : (
          tab === "text" && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5">
              <h2 className="text-lg font-semibold">Verdict</h2>
              <p className="mt-2 text-sm text-gray-500">
                Your result appears here — RED &ldquo;Suspicious — do not
                trust&rdquo;, AMBER &ldquo;Can&apos;t verify&rdquo;, or grey
                &ldquo;Looks consistent&rdquo;. ScamLens never says
                &ldquo;safe&rdquo;.
              </p>
            </div>
          )
        )}
      </section>
    </main>
  );
}
