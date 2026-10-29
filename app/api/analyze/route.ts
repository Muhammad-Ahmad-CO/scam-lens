import { NextResponse } from "next/server";
import { sparkJson } from "../../../lib/meta-client";
import {
  SCAM_SYSTEM_PROMPT,
  buildUserMessage,
} from "../../../lib/scam-prompt";
import { resolveVerdict, type TrapSignal } from "../../../lib/verdict";

// Day-2 scope: the 'text' path only.
// POST /api/analyze { inputType: 'text', text } ->
//   { verdict, signals, explanation_en, safe_action }
// Photo and voice input arrive on Day 3.

const MAX_TEXT_LENGTH = 4000;
const MAX_SIGNALS = 4;

export async function POST(req: Request) {
  let body: { inputType?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const inputType = typeof body.inputType === "string" ? body.inputType : "text";
  if (inputType !== "text") {
    return NextResponse.json(
      { error: "Photo and voice input arrive on Day 3." },
      { status: 501 }
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json(
      { error: "Please paste a message first." },
      { status: 400 }
    );
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: "Message is too long — please keep it under 4000 characters." },
      { status: 400 }
    );
  }

  try {
    const modelJson: unknown = await sparkJson(
      SCAM_SYSTEM_PROMPT,
      buildUserMessage(text)
    );
    const verdict = resolveVerdict(modelJson);

    const rawSignals =
      typeof modelJson === "object" &&
      modelJson !== null &&
      Array.isArray((modelJson as { signals?: unknown }).signals)
        ? (modelJson as { signals: unknown[] }).signals
        : [];
    const signals: TrapSignal[] = rawSignals
      .slice(0, MAX_SIGNALS)
      .map((s) => ({
        type:
          typeof s === "object" && s !== null && typeof (s as { type?: unknown }).type === "string"
            ? (s as { type: string }).type
            : "unknown",
        quote:
          typeof s === "object" && s !== null && typeof (s as { quote?: unknown }).quote === "string"
            ? (s as { quote: string }).quote
            : "",
        why:
          typeof s === "object" && s !== null && typeof (s as { why?: unknown }).why === "string"
            ? (s as { why: string }).why
            : "",
      }));

    const asText = (value: unknown): string =>
      typeof value === "string" && value.trim() ? value.trim() : "";
    const modelObj =
      typeof modelJson === "object" && modelJson !== null
        ? (modelJson as Record<string, unknown>)
        : {};

    const explanation_en =
      asText(modelObj.explanation_en) ||
      "ScamLens could not explain this message clearly.";
    const safe_action =
      asText(modelObj.safe_action) ||
      "Delete the message and report it as spam. If it claims to be from your bank, check through the bank's official app or helpline.";

    return NextResponse.json({ verdict, signals, explanation_en, safe_action });
  } catch (err) {
    // Honest failure: never a fake result.
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Analysis failed: ${message}. Please try again — no result was faked.` },
      { status: 500 }
    );
  }
}
