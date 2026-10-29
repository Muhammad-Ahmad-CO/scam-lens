// CLIENT-ONLY module: wraps the Web Speech API (the device's own voices).
// No server TTS is used anywhere in ScamLens.
//
// TAP-ONLY RULE: call speak() ONLY from a user tap/click handler.
// Never call it on page load, on mount, or when a result arrives.
// Never autoplay.

export interface VoiceLanguage {
  code: string;
  name: string;
}

/** The 12 locked voice languages (spoken verdict only) — nothing else. */
export const VOICE_LANGUAGES: VoiceLanguage[] = [
  { code: "en", name: "English" },
  { code: "ur", name: "Urdu" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "tr", name: "Turkish" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
];

export function languageName(code: string): string {
  return VOICE_LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

export function getVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  return s ? s.getVoices() : [];
}

function normalize(lang: string): string {
  return lang.toLowerCase().replace("_", "-");
}

/**
 * Pick the best device voice for a language code.
 * Exact locale match first (e.g. "ur-pk"), then language-prefix match ("ur").
 * Returns null when the device has no voice for the locale — no silent fallback.
 */
export function pickVoice(langCode: string): SpeechSynthesisVoice | null {
  const voices = getVoices();
  const want = normalize(langCode);
  const exact =
    voices.find((v) => normalize(v.lang) === want) ?? null;
  if (exact) return exact;
  return (
    voices.find(
      (v) => normalize(v.lang) === want || normalize(v.lang).startsWith(want + "-")
    ) ?? null
  );
}

export function hasVoiceFor(langCode: string): boolean {
  return pickVoice(langCode) !== null;
}

export interface SpeakResult {
  ok: boolean;
  message: string;
}

/**
 * Speak text with the device's own voice for the given language.
 * MUST be called from a tap/click handler only. Cancels any current speech.
 * If the device has no voice for the locale, says so exactly — never fakes it.
 */
export function speak(text: string, langCode: string): SpeakResult {
  const s = synth();
  if (!s) {
    return {
      ok: false,
      message: "Voice is not supported on this device. The verdict is shown in English above.",
    };
  }
  const name = languageName(langCode);
  const voice = pickVoice(langCode);
  if (!voice) {
    return {
      ok: false,
      message: `This device has no voice for ${name}. The verdict is shown in English above.`,
    };
  }
  s.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = voice;
  utter.lang = voice.lang;
  s.speak(utter);
  return { ok: true, message: `Speaking in ${name}…` };
}
