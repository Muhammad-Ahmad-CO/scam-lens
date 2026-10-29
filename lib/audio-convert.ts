// CLIENT-ONLY module: uses browser Web Audio APIs.
// Never import this from a server component or an API route.

export interface WavResult {
  /** Raw base64 of the WAV file (no data-URL prefix). */
  base64: string;
  durationSec: number;
}

const TARGET_SAMPLE_RATE = 16000;
const MAX_DURATION_SEC = 10 * 60; // 10 minutes (transcribe cap)
const MAX_FILE_BYTES = 32 * 1024 * 1024; // 32 MB (transcribe cap)

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + CHUNK))
    );
  }
  return btoa(binary);
}

/** Encode mono float samples as 16-bit PCM WAV (16 kHz, mono). */
function encodeWav16kMono(samples: Float32Array): ArrayBuffer {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, TARGET_SAMPLE_RATE, true);
  view.setUint32(28, TARGET_SAMPLE_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/**
 * Convert any browser-decodable audio file (m4a, mp3, ogg, wav, …)
 * into mono 16-bit PCM WAV at 16 kHz — the format the transcribe
 * service requires. No server ffmpeg needed.
 */
export async function fileToWav16kMono(file: File): Promise<WavResult> {
  if (typeof window === "undefined") {
    throw new Error("Voice conversion needs a browser.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Voice note is too large — please keep it under 32 MB.");
  }

  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
    OfflineAudioContext?: typeof OfflineAudioContext;
    webkitOfflineAudioContext?: typeof OfflineAudioContext;
  };
  const AC = w.AudioContext ?? w.webkitAudioContext;
  if (!AC) {
    throw new Error("This browser cannot decode audio files.");
  }

  const raw = await file.arrayBuffer();
  const ctx = new AC();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(raw.slice(0));
  } catch {
    await ctx.close().catch(() => undefined);
    throw new Error(
      "Could not read this audio file. Try a voice note saved as m4a, mp3, or wav."
    );
  }
  const durationSec = decoded.duration;
  await ctx.close().catch(() => undefined);

  if (!durationSec || !isFinite(durationSec)) {
    throw new Error("Could not read this audio file.");
  }
  if (durationSec > MAX_DURATION_SEC) {
    throw new Error("Voice note is too long — please keep it under 10 minutes.");
  }

  // Mix down to mono.
  const first = decoded.getChannelData(0);
  let mono: Float32Array;
  if (decoded.numberOfChannels === 1) {
    mono = first;
  } else {
    mono = new Float32Array(first.length);
    for (let c = 0; c < decoded.numberOfChannels; c++) {
      const ch = decoded.getChannelData(c);
      for (let i = 0; i < ch.length; i++) {
        mono[i] += ch[i] / decoded.numberOfChannels;
      }
    }
  }

  // Resample to 16 kHz mono.
  const Offline = w.OfflineAudioContext ?? w.webkitOfflineAudioContext;
  if (!Offline) {
    throw new Error("This browser cannot resample audio.");
  }
  const targetLen = Math.max(1, Math.ceil(durationSec * TARGET_SAMPLE_RATE));
  const off = new Offline(1, targetLen, TARGET_SAMPLE_RATE);
  const buf = off.createBuffer(1, mono.length, decoded.sampleRate);
  buf.getChannelData(0).set(mono);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start(0);
  const rendered = await off.startRendering();
  const out = rendered.getChannelData(0);

  const wav = encodeWav16kMono(out);
  return { base64: arrayBufferToBase64(wav), durationSec };
}
