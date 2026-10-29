// Server-only module. Never import this from a client component.
// It reads API keys from server-side env vars only — keys never leave the server.

type Provider = "meta" | "baseten";

interface ProviderConfig {
  provider: Provider;
  baseUrl: string;
  apiKey: string;
  model: string;
}

function getConfig(): ProviderConfig {
  const raw = (process.env.AI_PROVIDER ?? "meta").trim().toLowerCase();

  if (raw === "baseten") {
    const apiKey = process.env.BASETEN_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing env var BASETEN_API_KEY (AI_PROVIDER=baseten needs it)"
      );
    }
    const model =
      process.env.BASETEN_MODEL?.trim() || "meta-models/muse-spark-open";
    return {
      provider: "baseten",
      baseUrl: "https://inference.baseten.co/v1",
      apiKey,
      model,
    };
  }

  // Default: Meta Model API
  const apiKey = process.env.META_API_KEY;
  if (!apiKey) {
    throw new Error("Missing env var META_API_KEY (AI_PROVIDER=meta needs it)");
  }
  return {
    provider: "meta",
    baseUrl: "https://api.meta.ai/v1",
    apiKey,
    model: "muse-spark-1.3",
  };
}

/**
 * Call the configured Muse model and return the reply parsed as JSON.
 * Uses an OpenAI-style chat-completions request with low temperature.
 * If the provider ignores response_format, the prompt still asks for
 * strict JSON, and code fences are stripped before parsing.
 */
export async function sparkJson(
  systemPrompt: string,
  userContent: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const { provider, baseUrl, apiKey, model } = getConfig();

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt + "\nReply with strict JSON only. No other text.",
        },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `${provider} API error ${res.status}: ${text.slice(0, 300)}`
    );
  }

  const data = await res.json();
  const content: unknown = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error(`${provider} returned an empty response`);
  }

  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(
      `${provider} did not return valid JSON: ${cleaned.slice(0, 300)}`
    );
  }
}
