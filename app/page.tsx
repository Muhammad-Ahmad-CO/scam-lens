"use client";

import { useEffect, useState } from "react";
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

// Static product mock for the hero — a hardcoded exhibit, not a real result.
const EXHIBIT_CHIPS = [
  "trap_01 / fake sender",
  "trap_02 / urgency",
  "trap_03 / short link",
  "trap_04 / otp demand",
];

export default function Home() {
  const [tab, setTab] = useState<TabId>("text");
  // The nav "Open a case" button only appears after scrolling past the hero,
  // so the first viewport keeps a single dominant CTA.
  const [showNavCta, setShowNavCta] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowNavCta(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
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

  const canCheck = !loading && text.trim().length > 0;

  return (
    <div className="min-h-screen bg-ink text-slate-200">
      {/* ── Slim header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
          <a href="#top" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="ScamLens logo" className="h-7 w-7" />
            <span className="font-display text-lg font-bold tracking-tight text-white">
              ScamLens
            </span>
          </a>
          <div className="flex items-center gap-5">
            <p className="hidden font-mono text-[11px] tracking-widest text-slate-500 sm:block">
              SCAM FORENSICS · v1.0
            </p>
            <nav className="hidden items-center gap-5 text-sm text-slate-400 md:flex">
              <a href="#traps" className="transition-colors hover:text-white">
                Traps
              </a>
              <a href="#rule" className="transition-colors hover:text-white">
                Our rule
              </a>
            </nav>
            <a
              href="#analyzer"
              className={`rounded-md border border-brand/60 px-3.5 py-1.5 text-sm font-semibold text-brand transition-all hover:bg-brand/10 ${
                showNavCta
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              Open a case
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero: asymmetric editorial split ──────────────────────── */}
      <section id="top" className="border-b border-white/10">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-12 md:py-16">
          <div className="md:col-span-7">
            <p className="font-mono text-xs text-brand">
              SCAM FORENSICS — CASE #001
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-7xl">
              Every scam
              <br />
              leaves fingerprints.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-300">
              Paste any shady message — ScamLens shows you the traps and tells
              you what to do, in your own language.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <a
                href="#analyzer"
                className="rounded-md bg-brand px-6 py-3 font-semibold text-ink transition-colors hover:bg-[#E85A45]"
              >
                Open a case
              </a>
              <a
                href="#traps"
                className="font-mono text-sm text-slate-400 underline-offset-4 transition-colors hover:text-brand hover:underline"
              >
                Meet the 7 traps ↓
              </a>
            </div>
          </div>

          {/* ── Static exhibit: CASE FILE #001 ── */}
          <div className="md:col-span-5">
            <div className="relative rounded-md border border-white/10 bg-panel p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <p className="font-mono text-xs tracking-widest text-brand">
                  CASE FILE #001
                </p>
                <p className="font-mono text-[10px] tracking-widest text-slate-500">
                  STATUS: OPEN
                </p>
              </div>

              <p className="mt-4 font-mono text-[11px] tracking-widest text-slate-500">
                FROM
              </p>
              <p className="mt-1 text-sm text-slate-200">
                <mark className="rounded-sm border-b-2 border-danger/60 bg-danger/20 px-1 text-red-100">
                  ALRT-BANK
                </mark>
                <span className="text-slate-500"> · +92 300 0000000</span>
              </p>

              <p className="mt-4 font-mono text-[11px] tracking-widest text-slate-500">
                MESSAGE
              </p>
              <p className="mt-1 rounded-md border border-white/10 bg-ink p-3 text-sm leading-relaxed text-slate-200">
                Your account{" "}
                <mark className="rounded-sm border-b-2 border-brand/60 bg-brand/20 px-1 text-[#F7C9C2]">
                  will be blocked within 24 hours
                </mark>
                . Verify now:{" "}
                <mark className="rounded-sm border-b-2 border-brand/60 bg-brand/20 px-1 text-[#F7C9C2]">
                  bit.ly/xyz12
                </mark>{" "}
                —{" "}
                <mark className="rounded-sm border-b-2 border-danger/60 bg-danger/20 px-1 text-red-100">
                  never share your OTP
                </mark>{" "}
                with anyone.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {EXHIBIT_CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="rounded border border-brand/40 bg-brand/10 px-2 py-1 font-mono text-[10px] text-brand"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <div className="absolute -right-2 top-14 -rotate-2 border-[3px] border-danger bg-ink/70 px-3 py-1 font-display text-xl font-bold uppercase tracking-[0.2em] text-danger">
                Suspicious
              </div>
            </div>
            <p className="mt-3 font-mono text-[11px] text-slate-500">
              Exhibit A — a textbook bank-impersonation SMS, traps marked.
            </p>
          </div>
        </div>
      </section>

      {/* ── 01 · Analyzer: the case folder ────────────────────────── */}
      <section id="analyzer" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <p className="font-mono text-xs text-brand">01 — Open a new case</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
            Run the check
          </h2>

          <div className="mt-6 inline-block rounded-t-md border border-b-0 border-white/10 bg-panel px-4 py-1.5 font-mono text-[11px] tracking-widest text-slate-400">
            CASE FOLDER
          </div>
          <div className="rounded-b-md rounded-tr-md border border-white/10 bg-panel p-5 md:p-6">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Input column */}
              <div>
                <div
                  className="flex gap-1 border-b border-white/10"
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
                        "-mb-px border-b-2 px-3 py-2 font-mono text-xs transition-colors " +
                        (tab === t.id
                          ? "border-brand text-brand"
                          : "border-transparent text-slate-500 hover:text-slate-200")
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
                        className="font-mono text-[11px] tracking-widest text-slate-500"
                      >
                        EVIDENCE — TEXT
                      </label>
                      <textarea
                        id="message"
                        rows={6}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste the SMS or WhatsApp message here…"
                        className="mt-2 w-full rounded-md border border-white/10 bg-ink p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-brand/60 focus:outline-none"
                      />
                      <button
                        onClick={checkMessage}
                        disabled={!canCheck}
                        className={
                          "mt-3 rounded-md px-6 py-2.5 text-sm font-semibold transition-colors " +
                          (canCheck
                            ? "bg-brand text-ink hover:bg-[#E85A45]"
                            : "cursor-not-allowed bg-slate-700/70 text-slate-400")
                        }
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
                    <p className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">
                      {error}
                    </p>
                  )}
                </div>
              </div>

              {/* Findings column */}
              <div className="border-t border-white/10 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                <p className="font-mono text-[11px] tracking-widest text-slate-500">
                  FINDINGS
                </p>
                <div className="mt-4">
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
                    <div className="rounded-md border border-white/10 bg-ink/60 p-5">
                      <p className="font-mono text-[11px] tracking-[0.25em] text-slate-500">
                        NO EVIDENCE LOGGED
                      </p>
                      <p className="mt-2 font-mono text-xs leading-relaxed text-slate-500">
                        Awaiting evidence — paste a message to open the case.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 02 · The seven traps: dossier list ────────────────────── */}
      <section id="traps" className="scroll-mt-20 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <p className="font-mono text-xs text-brand">02 — The seven traps</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
            Know them by name
          </h2>
          <ol className="mt-6 border-t border-white/10">
            {TRAPS.map((t, i) => (
              <li
                key={t.title}
                className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-b border-white/10 py-4 md:grid-cols-[3.5rem_11rem_1fr] md:gap-x-6"
              >
                <span className="font-mono text-sm text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-base font-semibold text-white">
                  {t.title}
                </h3>
                <p className="col-span-2 text-sm leading-relaxed text-slate-400 md:col-span-1">
                  {t.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 03 · Our rule: stamped panel ──────────────────────────── */}
      <section id="rule" className="scroll-mt-20 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <p className="font-mono text-xs text-brand">03 — Our rule</p>
          <div className="relative mt-6 rounded-md border border-brand/30 bg-panel p-8 md:p-10">
            <span className="absolute -top-3.5 left-6 -rotate-2 border-2 border-brand bg-ink px-3 py-1 font-mono text-xs tracking-widest text-brand">
              STANDING RULE
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
              We never say &ldquo;safe&rdquo;.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-300">
              A wrong &ldquo;safe&rdquo; verdict is dangerous — it could cost
              someone their savings. So when ScamLens is unsure, it says it
              can&apos;t verify, and tells you exactly what to do instead.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer: compact single row ────────────────────────────── */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="ScamLens logo" className="h-6 w-6" />
            <span className="font-display font-bold text-white">ScamLens</span>
          </div>
          <p className="font-mono text-[11px] text-slate-500">
            Built with Muse Spark 1.3 · Voice Transcribe 1.0 · Image 1.0
          </p>
          <a
            href="https://github.com/Muhammad-Ahmad-CO/scam-lens"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] text-slate-400 underline-offset-4 hover:text-brand hover:underline"
          >
            Public repository ↗
          </a>
          <p className="font-mono text-[11px] tracking-widest text-slate-600">
            HACKATHON BUILD
          </p>
        </div>
      </footer>
    </div>
  );
}
