// SERVER-ONLY module. Never import this from a client component.
// Free translation via MyMemory (proven pattern). Used only to translate the
// spoken verdict text — the written site and verdict always stay English.

/** The 12 locked voice languages (spoken verdict only). */
export const VOICE_LANG_CODES = [
  "en",
  "ur",
  "ar",
  "hi",
  "fr",
  "es",
  "de",
  "pt",
  "ru",
  "tr",
  "zh",
  "ja",
] as const;

export type VoiceLangCode = (typeof VOICE_LANG_CODES)[number];

/** MyMemory target codes (zh must be zh-CN there). */
const MYMEMORY_TARGET: Record<VoiceLangCode, string> = {
  en: "en",
  ur: "ur",
  ar: "ar",
  hi: "hi",
  fr: "fr",
  es: "es",
  de: "de",
  pt: "pt",
  ru: "ru",
  tr: "tr",
  zh: "zh-CN",
  ja: "ja",
};

export function isVoiceLangCode(value: unknown): value is VoiceLangCode {
  return (
    typeof value === "string" &&
    (VOICE_LANG_CODES as readonly string[]).includes(value)
  );
}

const MAX_TRANSLATE_CHARS = 1000;

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number;
  responseDetails?: string;
}

export async function translateText(
  text: string,
  targetLang: string
): Promise<string> {
  if (!isVoiceLangCode(targetLang)) {
    throw new Error("Unsupported language.");
  }
  const t = text.trim();
  if (!t) {
    throw new Error("Nothing to translate.");
  }
  if (t.length > MAX_TRANSLATE_CHARS) {
    throw new Error("Text too long to translate (1000 characters max).");
  }

  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(t) +
    "&langpair=en|" +
    MYMEMORY_TARGET[targetLang];

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(
      `Translation service unreachable: ${
        err instanceof Error ? err.message : "network error"
      }`
    );
  }
  if (!res.ok) {
    throw new Error(`Translation failed (${res.status}).`);
  }

  let data: MyMemoryResponse;
  try {
    data = (await res.json()) as MyMemoryResponse;
  } catch {
    throw new Error("Translation returned an unreadable response.");
  }
  const out = data?.responseData?.translatedText;
  if (typeof out !== "string" || !out.trim()) {
    throw new Error(
      `Translation failed: ${data?.responseDetails || "no text returned"}`
    );
  }
  return out.trim();
}
