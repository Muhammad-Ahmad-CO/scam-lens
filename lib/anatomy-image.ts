// SERVER-ONLY module. Never import this from a client component.
// Generates the "scam anatomy" explainer visual via Muse Image 1.0.
//
// RESEARCH CAVEAT (loud): the endpoint shape below comes from SECONDARY
// sources, NOT from Meta's official docs — it has not been verified here.
// Endpoint: POST https://api.meta.ai/v1/images/generations
//   model "muse-image-1.0", Bearer META_API_KEY, $0.01/image.
// If Meta's real API differs (field names, response shape), the honest
// 503 path in /api/anatomy surfaces the exact error and the UI hides the
// button — the fix is a few lines in this file, never a fake visual.
// Image is Meta-only: always META_API_KEY, even when AI_PROVIDER=baseten.

/** The 7 known scam-signal taxonomy ids (shared with lib/scam-prompt.ts). */
export const KNOWN_SIGNAL_TYPES = [
  "fake_sender",
  "urgency_threat",
  "short_link",
  "otp_demand",
  "prize_lure",
  "impersonation",
  "off_platform_move",
] as const;

/** Thrown for every image-unavailable condition: missing key, API 4xx/5xx
 * (billing/geo included), network failure, unexpected response. The API
 * route maps this to 503 { imageUnavailable: true }. */
export class ImageUnavailableError extends Error {}

// One short visual step per signal type, in taxonomy order.
const STEP_PHRASES: Record<string, string> = {
  fake_sender: "a phone showing a message from a fake sender name",
  urgency_threat: "a worried victim feeling fear and urgency",
  short_link: "a finger about to tap a suspicious shortened link",
  otp_demand: "a thief stealing a one-time passcode",
  prize_lure: "a fake prize lure tempting the victim",
  impersonation: "a scammer pretending to be a bank or government official",
  off_platform_move: "the victim being lured into another chat app",
};

/** Keep only known ids, de-duplicated, in taxonomy order. */
export function validSignalTypes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of KNOWN_SIGNAL_TYPES) {
    if (raw.includes(t) && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

function buildPrompt(ids: string[]): string {
  const steps = ids.slice(0, 5).map((id) => STEP_PHRASES[id]);
  return (
    "simple flat educational diagram, no readable text, " +
    "showing how an SMS scam tricks a victim step by step: " +
    "a suspicious message arriving on a phone -> " +
    steps.join(" -> ") +
    " -> the scammer stealing money or information"
  );
}

function asBase64(buf: ArrayBuffer): string {
  // Node runtime: Buffer is available in Next.js route handlers.
  return Buffer.from(buf).toString("base64");
}

export async function generateAnatomyImage(
  signalTypes: string[]
): Promise<{ base64: string; mimeType: string }> {
  const ids = validSignalTypes(signalTypes);
  if (ids.length === 0) {
    throw new ImageUnavailableError("No known scam signals to illustrate.");
  }

  const apiKey = process.env.META_API_KEY;
  if (!apiKey) {
    throw new ImageUnavailableError(
      "Image generation needs the Meta API key (META_API_KEY), which is not set."
    );
  }

  const prompt = buildPrompt(ids);

  let res: Response;
  try {
    res = await fetch("https://api.meta.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "muse-image-1.0", prompt }),
    });
  } catch {
    throw new ImageUnavailableError(
      "Could not reach the image service. Check your connection and try again."
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ImageUnavailableError(
      `Image service error ${res.status}: ${text.slice(0, 200) || "no details"}. ` +
        "This can mean billing, region, or key problems."
    );
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ImageUnavailableError(
      "The image service returned a response that could not be read."
    );
  }

  // Flexible parse: try base64 first, then a hosted URL we fetch server-side.
  const first =
    typeof data === "object" && data !== null && Array.isArray((data as { data?: unknown }).data)
      ? (data as { data: unknown[] }).data[0]
      : data;
  const obj = (typeof first === "object" && first !== null ? first : {}) as Record<string, unknown>;

  if (typeof obj.b64_json === "string" && obj.b64_json) {
    return { base64: obj.b64_json, mimeType: "image/png" };
  }

  if (typeof obj.url === "string" && obj.url) {
    try {
      const imgRes = await fetch(obj.url);
      if (!imgRes.ok) throw new Error();
      const buf = await imgRes.arrayBuffer();
      const ct = imgRes.headers.get("content-type") || "image/png";
      return { base64: asBase64(buf), mimeType: ct.split(";")[0] };
    } catch {
      throw new ImageUnavailableError(
        "The image service returned a link that could not be downloaded."
      );
    }
  }

  throw new ImageUnavailableError(
    "The image service returned an unexpected response format."
  );
}
