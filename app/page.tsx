"use client";

import { useState } from "react";

type TabId = "text" | "photo" | "voice";

const TABS: { id: TabId; label: string }[] = [
  { id: "text", label: "Paste text" },
  { id: "photo", label: "Upload photo" },
  { id: "voice", label: "Upload voice note" },
];

export default function Home() {
  const [tab, setTab] = useState<TabId>("text");

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
              disabled
              placeholder="Paste the SMS or WhatsApp message here…"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm"
            />
            <p className="mt-3 text-xs text-gray-500">
              Day 2: the text pipeline (Spark analysis → verdict card) wires up
              here.
            </p>
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

      <section className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-5">
        <h2 className="text-lg font-semibold">Verdict</h2>
        <p className="mt-2 text-sm text-gray-500">
          Day 2: the verdict card appears here — RED "Suspicious — do not
          trust", AMBER "Can&apos;t verify", or grey "Looks consistent".
          ScamLens never says "safe".
        </p>
      </section>
    </main>
  );
}
