import { NextResponse } from "next/server";
import { translateText, isVoiceLangCode } from "../../../lib/translate";

// POST /api/translate { text, targetLang } -> { translated }
// Translates the SPOKEN verdict text only. Written UI stays English.

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  const targetLang = typeof body.targetLang === "string" ? body.targetLang : "";

  if (!text.trim()) {
    return NextResponse.json({ error: "Nothing to translate." }, { status: 400 });
  }
  if (!isVoiceLangCode(targetLang)) {
    return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
  }

  try {
    const translated = await translateText(text, targetLang);
    return NextResponse.json({ translated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Translation failed: ${message}` },
      { status: 500 }
    );
  }
}
