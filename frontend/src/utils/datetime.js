// src/utils/datetime.js
import { DateTime } from "luxon";

/**
 * Convert a <input type="datetime-local"> value (e.g. "2025-10-12T09:30")
 * interpreted in the given IANA timezone (e.g. "Europe/Berlin") to a UTC ISO.
 * Returns undefined if dtLocal is falsy or invalid.
 */
export function toUtcIso(dtLocal, timezone = "Europe/Berlin") {
  if (!dtLocal) return undefined;

  // Interpret the naive local string in the chosen timezone
  const dt = DateTime.fromISO(String(dtLocal), { zone: timezone });
  if (!dt.isValid) return undefined;

  return dt.toUTC().toISO(); // precise instant
}

/**
 * Ensure the timezone string is usable; fallback to Europe/Berlin.
 */
export function normalizeTz(tz) {
  return tz && typeof tz === "string" ? tz : "Europe/Berlin";
}
