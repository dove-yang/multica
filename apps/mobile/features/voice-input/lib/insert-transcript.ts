import type { InsertResult, TextSelection } from "../types";

const CJK = /[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]/;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isCjk(char: string): boolean {
  return CJK.test(char);
}

/** A single space is only needed between two latin word characters. */
function needsSpace(left: string, right: string): boolean {
  if (!left || !right) return false;
  if (isCjk(left) || isCjk(right)) return false;
  return /[A-Za-z0-9]$/.test(left) && /^[A-Za-z0-9]/.test(right);
}

/** Collapse the whisper-y whitespace the recognizer sometimes returns. */
export function normalizeTranscript(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\s+([，。！？；：、,.!?;:])/g, "$1")
    .trim();
}

/**
 * Insert a dictated transcript at the current selection (or append when the
 * field was never focused). Never strips the surrounding draft; the caller
 * decides what to do with the resulting text.
 */
export function insertTranscript(
  existing: string,
  transcript: string,
  selection: TextSelection | null,
): InsertResult {
  const cleaned = normalizeTranscript(transcript);
  const fallbackStart = existing.length;
  if (!cleaned) {
    return {
      text: existing,
      cursor: clamp(selection?.start ?? fallbackStart, 0, existing.length),
    };
  }

  const start = clamp(selection?.start ?? fallbackStart, 0, existing.length);
  const end = clamp(selection?.end ?? start, start, existing.length);
  const before = existing.slice(0, start);
  const after = existing.slice(end);

  const leadingSpace = needsSpace(before.slice(-1), cleaned.slice(0, 1))
    ? " "
    : "";
  const trailingSpace = needsSpace(cleaned.slice(-1), after.slice(0, 1))
    ? " "
    : "";

  const text = `${before}${leadingSpace}${cleaned}${trailingSpace}${after}`;
  return {
    text,
    cursor:
      before.length + leadingSpace.length + cleaned.length + trailingSpace.length,
  };
}
