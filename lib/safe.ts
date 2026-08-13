export function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

// Numbers arrive as numbers, numeric strings, null, undefined, or nonsense.
export function num(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function numOr(value: unknown, fallback: number): number {
  return num(value) ?? fallback;
}

// Matches the old `x || fallback` behaviour: zero and negatives fall back too.
export function positiveOr(value: unknown, fallback: number): number {
  const parsed = num(value);
  return parsed !== null && parsed > 0 ? parsed : fallback;
}

export function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// Win rate as 0..1. Null when nobody has played a game, so 0/0 never becomes NaN.
export function ratio(wins: unknown, losses: unknown): number | null {
  const w = numOr(wins, 0);
  const l = numOr(losses, 0);
  const total = w + l;
  if (total <= 0) return null;
  return w / total;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Errors cross the server-action boundary, and Next can't always serialize an
// Error instance. Always hand the client a plain string.
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err) ?? "Unknown error";
  } catch {
    return "Unknown error";
  }
}
