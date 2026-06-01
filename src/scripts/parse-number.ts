const SUFFIX_MULTIPLIER_MAP: ReadonlyMap<string, number> = new Map([
  ["k", 1_000],
  ["m", 1_000_000],
  ["b", 1_000_000_000],
]);

export function parseAbbreviatedNumber(text: string | null): number | null {
  if (text === null) {
    return null;
  }
  const cleaned = text.trim().replace(/,/g, "").toLowerCase();
  if (cleaned === "") {
    return null;
  }

  const suffix = cleaned.slice(-1);
  const multiplier = SUFFIX_MULTIPLIER_MAP.get(suffix);
  const numericPart = multiplier === undefined ? cleaned : cleaned.slice(0, -1);

  if (numericPart === "" || numericPart === "-" || numericPart === ".") {
    return null;
  }
  const base = Number(numericPart);
  if (!Number.isFinite(base)) {
    return null;
  }

  return multiplier === undefined ? base : base * multiplier;
}
