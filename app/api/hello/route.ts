import { NextResponse } from "next/server";
import { sparkJson } from "../../../lib/meta-client";

// Day-1 hello-world test: asks the configured model to return strict JSON.
// GET /api/hello -> {"status":"ok","model":"..."} or {"error":"..."}
export async function GET() {
  try {
    const result = await sparkJson(
      "Reply with strict JSON only.",
      'Return exactly this JSON object: {"status":"ok","model":"<your model name>"}. Replace <your model name> with the actual name of the model you are.'
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
