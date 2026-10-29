// Verdict state machine. Shared by the API route (server) and the UI (client).
// HARD RULE: no code path may ever produce a "safe" verdict label.

export type VerdictLevel = "red" | "amber" | "grey";

export interface DisplayVerdict {
  level: VerdictLevel;
  title: string;
  description: string;
}

export interface TrapSignal {
  type: string;
  quote: string;
  why: string;
}

const AMBER_CANNOT_VERIFY: DisplayVerdict = {
  level: "amber",
  title: "Can't verify",
  description:
    "ScamLens could not decide from this message. It never says a message is safe — when unsure, it says it can't verify.",
};

export function resolveVerdict(modelJson: unknown): DisplayVerdict {
  const raw =
    typeof modelJson === "object" &&
    modelJson !== null &&
    typeof (modelJson as { verdict?: unknown }).verdict === "string"
      ? ((modelJson as { verdict: string }).verdict.trim().toUpperCase())
      : "";

  // Enforcement: missing verdict, unrecognized verdict, or the word "safe"
  // in ANY casing all force AMBER ("Can't verify").
  if (!raw || raw.includes("SAFE")) {
    return AMBER_CANNOT_VERIFY;
  }

  switch (raw) {
    case "SUSPICIOUS":
      return {
        level: "red",
        title: "Suspicious — do not trust",
        description:
          "This message shows patterns commonly used in scams. Do not click any link and do not share any code.",
      };
    case "CANNOT_VERIFY":
      return AMBER_CANNOT_VERIFY;
    case "LOOKS_CONSISTENT":
      return {
        level: "grey",
        title: "Looks consistent",
        description:
          "No clear scam pattern was found in this message. Stay careful — this is not a promise that it is harmless.",
      };
    default:
      return AMBER_CANNOT_VERIFY;
  }
}
