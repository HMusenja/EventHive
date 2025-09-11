// src/utils/tagsClient.js
const TAG_RE = /^[a-z0-9](?:[a-z0-9 -]{0,22}[a-z0-9])?$/i; // 1–24, alnum/space/dash, start/end alnum

export function normalizeTag(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function isValidTag(s) {
  return TAG_RE.test(String(s));
}

export function splitPasted(input) {
  // split by comma or newline; also support multi-space
  return String(input).split(/[,\n]+/).map((t) => t.trim()).filter(Boolean);
}
