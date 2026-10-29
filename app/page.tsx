"use client";

import { useState } from "react";
import TrapHighlight from "../components/TrapHighlight";
import VerdictCard from "../components/VerdictCard";
import VerdictAudio from "../components/VerdictAudio";
import AnatomyVisual from "../components/AnatomyVisual";
import PhotoInput from "../components/PhotoInput";
import VoiceInput from "../components/VoiceInput";
import type { AnalyzeResult } from "../lib/verdict";

type TabId = "text" | "photo" | "voice";

const TABS: { id: TabId; label: string }[] = [
  { id: "text", label: "Paste text" },
  { id: "photo", label: "Upload photo" },
  { id: "voice", label: "Upload voice note" },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Paste or upload the message",
    body: "Drop in a shady SMS, a screenshot of one, or a voice note. No account, no setup — it stays on your device until you tap check.",
  },
  {
    step: "2",
    title: "AI finds the traps",
    body: "Muse Spark reads the message and marks up to 4 scam signals — fake sender, urgency, bad links, OTP demands — each with a plain-English reason.",
  },
  {
    step: "3",
    title: "Get the verdict + what to do",
    body: "RED, AMBER, or grey — plus the exact safe action to take. Tap once to hear it spoken in 12 languages.",
  },
];

const TRAPS = [
  {
    title: "Fake sender",
    body: "The name or number looks almost right — but it isn't the real one.",
  },
  {
    title: "Urgency or threat",
    body: "It pressures you to act now: “your account will be blocked”.",
  },
  {
    title: "Shortened link",
    body: "A short or strange link hides where it really takes you.",
  },
  {
    title: "OTP / password demand",
    body: "No real bank or service asks for your OTP or password this way.",
  },
  {
    title: "Prize or lottery lure",
    body: "You “won” something you never entered — that is the bait.",
  },
  {
    title: "Impersonation",
    body: "It pretends to be your bank, the government, or a courier.",
  },
  {
    title: "Off-platform move",
    body: "It tries to pull you into another chat or app to continue the trick.",
  },
];

export default function Home() {
  const [tab, setTab] = useState<TabId>("text");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  function handleStart() {
    setError(null);
    setResult(null);
  }

  function handleResult(r: AnalyzeResult) {
    setError(null);
    setResult(r);
  }

  function handleError(msg: string) {
    setError(msg || null);
  }

  async function checkMessage() {
    handleStart();
    setLoading(true);
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
      handleResult({
        verdict: data.verdict,
        signals: Array.isArray(data.signals) ? data.signals : [],
        explanation_en:
          typeof data.explanation_en === "string" ? data.explanation_en : "",
        safe_action:
          typeof data.safe_action === "string" ? data.safe_action : "",
        source_text: typeof data.source_text === "string" ? data.source_text : text,
      });
    } catch (err) {
      handleError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-slate-200">
      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#top" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="ScamLens logo" className="h-8 w-8" />
            <span className="font-display text-xl font-bold tracking-tight text-white">
              ScamLens
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-white">
              How it works
            </a>
            <a href="#traps" className="transition-colors hover:text-white">
              Traps
            </a>
            <a href="#honesty" className="transition-colors hover:text-white">
              Honesty
            </a>
          </nav>
          <a
            href="#analyzer"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-[#ffbe45]"
          >
            Check a message
          </a>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden">
        <img
          src="/hero.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/75" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            AI scam-signal detector
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            Spot the scam before it spots you.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
            Paste any shady message — ScamLens shows you the traps and tells
            you what to do, in your own language.
          </p>
          <a
            href="#analyzer"
            className="mt-8 inline-block rounded-full bg-brand px-7 py-3 font-semibold text-ink transition-colors hover:bg-[#ffbe45]"
          >
            Check a message now
          </a>
          <div className="mt-10 flex flex-wrap gap-3">
            {["3 input types", "7 scam traps", "12 voice languages"].map(
              (chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-200"
                >
                  {chip}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Analyzer ──────────────────────────────────────────────── */}
      <section
        id="analyzer"
        className="scroll-mt-20 border-t border-white/10 bg-navy"
      >
        <div className="mx-auto max-w-4xl px-4 py-14 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            The analyzer
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Check a message
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Paste text, upload a screenshot, or upload a voice note — the same
            scam check runs on all three.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-panel p-5 shadow-2xl md:p-7">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Input type"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors " +
                    (tab === t.id
                      ? "border-brand bg-brand text-ink"
                      : "border-white/15 bg-transparent text-slate-300 hover:border-white/30 hover:text-white")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-5">
              {tab === "text" && (
                <div>
                  <label
                    htmlFor="message"
                    className="text-sm font-medium text-slate-300"
                  >
                    Suspicious message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste the SMS or WhatsApp message here…"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-ink p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand/60 focus:outline-none"
                  />
                  <button
                    onClick={checkMessage}
                    disabled={loading || !text.trim()}
                    className="mt-3 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-[#ffbe45] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Analyzing…" : "Check message"}
                  </button>
                </div>
              )}

              {tab === "photo" && (
                <PhotoInput
                  onResult={handleResult}
                  onError={handleError}
                  onStart={handleStart}
                />
              )}

              {tab === "voice" && (
                <VoiceInput
                  onResult={handleResult}
                  onError={handleError}
                  onStart={handleStart}
                />
              )}

              {error && (
                <p className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* ── Results ── */}
          <div className="mt-8">
            {result ? (
              <div>
                <TrapHighlight
                  text={result.source_text}
                  signals={result.signals}
                />
                <VerdictCard
                  verdict={result.verdict}
                  explanation={result.explanation_en}
                  safeAction={result.safe_action}
                />
                <VerdictAudio explanationEn={result.explanation_en} />
                {result.verdict.level === "red" && (
                  <AnatomyVisual
                    signals={result.signals.map((s) => s.type)}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-panel/60 p-6">
                <h3 className="font-display text-lg font-semibold text-white">
                  Verdict
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Your result appears here — RED &ldquo;Suspicious — do not
                  trust&rdquo;, AMBER &ldquo;Can&apos;t verify&rdquo;, or grey
                  &ldquo;Looks consistent&rdquo;. ScamLens never says
                  &ldquo;safe&rdquo;.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-white/10"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Three steps to a clear answer
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-white/10 bg-panel p-6"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 font-display text-lg font-bold text-brand">
                  {s.step}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The 7 traps ───────────────────────────────────────────── */}
      <section
        id="traps"
        className="scroll-mt-20 border-t border-white/10 bg-navy"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            Signal taxonomy
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            The 7 traps we hunt
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Every message is scanned for these classic scam patterns — each hit
            is highlighted in your message with a plain-English reason.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRAPS.map((t) => (
              <div
                key={t.title}
                className="rounded-2xl border border-white/10 bg-panel p-5"
              >
                <h3 className="font-display text-base font-semibold text-brand">
                  {t.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {t.body}
                </p>
              </div>
            ))}
            <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
              <h3 className="font-display text-base font-semibold text-white">
                Found something else?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                If the message feels wrong but matches no trap above, ScamLens
                says it can&apos;t verify — and tells you the safe action
                anyway.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Honesty ───────────────────────────────────────────────── */}
      <section
        id="honesty"
        className="scroll-mt-20 border-y border-brand/30 bg-brand/10"
      >
        <div className="mx-auto max-w-4xl px-4 py-14 text-center md:py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            We never say &ldquo;safe&rdquo;.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-slate-300">
            A wrong &ldquo;safe&rdquo; verdict is dangerous — it could cost
            someone their savings. So when ScamLens is unsure, it says it
            can&apos;t verify, and tells you exactly what to do instead.
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="ScamLens logo" className="h-7 w-7" />
              <span className="font-display text-lg font-bold text-white">
                ScamLens
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Built with Muse Spark 1.3 · Muse Voice Transcribe 1.0 · Muse
              Image 1.0
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <a
              href="https://github.com/Muhammad-Ahmad-CO/scam-lens"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 underline-offset-4 hover:text-brand hover:underline"
            >
              Public repository
            </a>
            <p>Hackathon build — genuinely new work, built for the Meta AI Developer Hackathon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
