// SERVER-ONLY module. Never import this from a client component.
// Transcribes a 16 kHz mono WAV (base64) via Meta Voice Transcribe 1.0.
//
// RESEARCH CAVEAT (flagged for the parent agent): the exact multipart field
// name, optional parameters, and response JSON shape of
// POST https://api.meta.ai/v1/asr/transcribe could not be verified against
// official Meta docs from here — the endpoint details come from the parent's
// web research. This module sends the file as multipart field "file" and
// parses the transcript flexibly (text / transcript / transcription, incl.
// a nested data.text). If Meta's API rejects the field name, its error
// message surfaces honestly to the user and the field name can be adjusted.

const TRANSCRIBE_URL = "https://api.meta.ai/v1/asr/transcribe";
const MAX_WAV_BYTES = 32 * 1024 * 1024; // 32 MB cap

/**
 * Transcribe a 16 kHz mono 16-bit PCM WAV (base64, no data-URL prefix).
 * Always uses META_API_KEY — even when AI_PROVIDER=baseten — because
 * transcription is a Meta-only service.
 * Never returns a fake transcript: every failure throws an honest error.
 */
export async function transcribeWav16k(wavBase64: string): Promise<string> {
  const apiKey = process.env.META_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Voice transcription needs the Meta API key. Add META_API_KEY in the Vercel env vars."
    );
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(wavBase64, "base64");
  } catch {
    throw new Error("The voice file was damaged during upload. Try again.");
  }
  if (bytes.length < 44) {
    throw new Error("The voice file looks empty or damaged. Try again.");
  }
  if (bytes.length > MAX_WAV_BYTES) {
    throw new Error("Voice note is too large — 32 MB max.");
  }

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(bytes)], { type: "audio/wav" }),
    "voice.wav"
  );

  let res: Response;
  try {
    res = await fetch(TRANSCRIBE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } catch (err) {
    throw new Error(
      `Could not reach the transcription service: ${
        err instanceof Error ? err.message : "network error"
      }`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Transcription failed (${res.status}): ${text.slice(0, 200) || "no details"}`
    );
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("Transcription returned an unreadable response.");
  }

  const d = (data ?? {}) as Record<string, unknown>;
  const nested =
    d.data && typeof d.data === "object"
      ? (d.data as Record<string, unknown>).text
      : undefined;
  const candidates = [d.text, d.transcript, d.transcription, nested];
  const transcript = candidates.find(
    (c): c is string => typeof c === "string" && c.trim().length > 0
  );
  if (!transcript) {
    throw new Error(
      "Transcription returned no text. The voice note may be silent or unclear."
    );
  }
  return transcript.trim();
}
