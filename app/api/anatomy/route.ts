import { NextResponse } from "next/server";
import {
  generateAnatomyImage,
  validSignalTypes,
} from "../../../lib/anatomy-image";

// POST /api/anatomy { signals: string[] }
// -> 200 { imageBase64, mimeType, cached } on success
// -> 400 on bad input
// -> 503 { imageUnavailable: true, error } when the image service is
//    unreachable (no key, billing/geo, API failure). The UI hides the
//    button in that case — never a fake or placeholder visual.
//
// CACHE NOTE: this project is stateless by design (no database), so the
// cache is an in-memory Map keyed by the sorted signal-set. It lives as
// long as the server instance is warm — enough that the demo never pays
// twice for the same signal-set in one session. A cold start simply
// re-generates (and re-pays $0.01) once.

const cache = new Map<string, { base64: string; mimeType: string }>();

function cacheKey(ids: string[]): string {
  return [...ids].sort().join("+");
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ids = validSignalTypes(body.signals);
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "No scam signals to illustrate." },
      { status: 400 }
    );
  }

  const key = cacheKey(ids);
  const hit = cache.get(key);
  if (hit) {
    return NextResponse.json({
      imageBase64: hit.base64,
      mimeType: hit.mimeType,
      cached: true,
    });
  }

  try {
    const img = await generateAnatomyImage(ids);
    cache.set(key, { base64: img.base64, mimeType: img.mimeType });
    return NextResponse.json({
      imageBase64: img.base64,
      mimeType: img.mimeType,
      cached: false,
    });
  } catch (err) {
    // Honest unavailability: never a 200 with a fake image.
    const reason = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { imageUnavailable: true, error: `Explainer visual unavailable: ${reason}` },
      { status: 503 }
    );
  }
}
