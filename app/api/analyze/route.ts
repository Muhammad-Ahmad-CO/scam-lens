import { NextResponse } from "next/server";
import { sparkJson, sparkVisionJson } from "../../../lib/meta-client";
import {
  SCAM_SYSTEM_PROMPT,
  buildUserMessage,
} from "../../../lib/scam-prompt";
import {
  resolveVerdict,
  type TrapSignal,
  type AnalyzeResult,
} from "../../../lib/verdict";
import { transcribeWav16k } from "../../../lib/transcribe";

// One endpoint for all 3 input types.
// POST /api/analyze ->
//   text:  { inputType: 'text', text }
//   photo: { inputType: 'photo', imageBase64, mimeType }
//   voice: { inputType: 'voice', audioBase64, mimeType }
// <- { verdict, signals, explanation_en, safe_action, source_text }

const MAX_TEXT_LENGTH = 4000;
const MAX_SIGNALS = 4;
const MAX_IMAGE_B64_CHARS = 12 * 1024 * 1024; // ~9 MB of image bytes
const MAX_AUDIO_B64_CHARS = 44 * 1024 * 1024; // ~33 MB of audio bytes

const OCR_SYSTEM_PROMPT =
  "You read text from a photo of a phone message (SMS or WhatsApp screenshot).";

function asText(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

/** The shared scam-analysis pipeline: text in, verdict JSON out. */
async function runScamPipeline(
  text: string
): Promise<Omit<AnalyzeResult, "source_text">> {
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
  const signals: TrapSignal[] = rawSignals.slice(0, MAX_SIGNALS).map((s) => ({
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

  return { verdict, signals, explanation_en, safe_action };
}

function honest500(err: unknown) {
  // Honest failure: never a fake result.
  const message = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json(
    {
      error: `Analysis failed: ${message}. Please try again — no result was faked.`,
    },
    { status: 500 }
  );
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const inputType = typeof body.inputType === "string" ? body.inputType : "text";

  // ---- TEXT path ----
  if (inputType === "text") {
    const text = asText(body.text);
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
      const result = await runScamPipeline(text);
      return NextResponse.json({ ...result, source_text: text });
    } catch (err) {
      return honest500(err);
    }
  }

  // ---- PHOTO path: vision reads the SMS screenshot into text ----
  if (inputType === "photo") {
    const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
    if (!imageBase64) {
      return NextResponse.json(
        { error: "Please choose a photo first." },
        { status: 400 }
      );
    }
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "That file is not a photo." },
        { status: 400 }
      );
    }
    if (imageBase64.length > MAX_IMAGE_B64_CHARS) {
      return NextResponse.json(
        { error: "Photo is too large — please use a smaller one." },
        { status: 400 }
      );
    }
    try {
      const ocr: unknown = await sparkVisionJson(
        OCR_SYSTEM_PROMPT,
        'Transcribe exactly all text visible in this image. Return strict JSON: {"text": "..."}. If no text is visible, return {"text": ""}.',
        imageBase64,
        mimeType
      );
      const extracted = asText((ocr as { text?: unknown })?.text);
      if (!extracted) {
        return NextResponse.json(
          { error: "No text found in the photo. Try a clearer screenshot." },
          { status: 400 }
        );
      }
      const result = await runScamPipeline(extracted);
      return NextResponse.json({ ...result, source_text: extracted });
    } catch (err) {
      return honest500(err);
    }
  }

  // ---- VOICE path: transcribe the voice note, then the same pipeline ----
  if (inputType === "voice") {
    const audioBase64 = typeof body.audioBase64 === "string" ? body.audioBase64 : "";
    if (!audioBase64) {
      return NextResponse.json(
        { error: "Please choose a voice note first." },
        { status: 400 }
      );
    }
    if (audioBase64.length > MAX_AUDIO_B64_CHARS) {
      return NextResponse.json(
        { error: "Voice note is too large — 32 MB max." },
        { status: 400 }
      );
    }
    try {
      const transcript = await transcribeWav16k(audioBase64);
      if (!transcript) {
        return NextResponse.json(
          { error: "No speech detected in the voice note." },
          { status: 400 }
        );
      }
      const result = await runScamPipeline(transcript);
      return NextResponse.json({ ...result, source_text: transcript });
    } catch (err) {
      return honest500(err);
    }
  }

  return NextResponse.json({ error: "Unknown input type." }, { status: 400 });
}
