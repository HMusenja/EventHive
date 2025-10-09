// Convert any tag shape to a clean string array
export function toStringTags(v) {
  if (Array.isArray(v)) {
    return v
      .map((t) => (typeof t === "string" ? t : t?.value || t?.label || ""))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

// Normalize (lowercase, trim, de-dupe, clamp length & count)
export function normalizeTags(v, max = 25, maxLen = 30) {
  return Array.from(
    new Set(
      toStringTags(v)
        .map((s) => s.toLowerCase())
        .map((s) => s.slice(0, maxLen))
    )
  ).slice(0, max);
}
