// src/hooks/useTagAutocomplete.js
import { useEffect, useMemo, useRef, useState } from "react";
import { suggestTags } from "@/api/onboardingApi";

/**
 * Module-level 60s prefix cache.
 * Key: `${eventId}|${qLower}`
 * Value: { items: string[], ts: number }
 */
const SUGGEST_CACHE = new Map();
const TTL = 60_000;

function getCached(eventId, qLower) {
  const now = Date.now();
  const exact = SUGGEST_CACHE.get(`${eventId}|${qLower}`);
  if (exact && now - exact.ts < TTL) return exact.items;

  for (let len = qLower.length - 1; len >= 1; len--) {
    const key = `${eventId}|${qLower.slice(0, len)}`;
    const hit = SUGGEST_CACHE.get(key);
    if (hit && now - hit.ts < TTL) return hit.items;
  }
  return null;
}
function setCached(eventId, qLower, items) {
  SUGGEST_CACHE.set(`${eventId}|${qLower}`, { items, ts: Date.now() });
}

// shallow array equality
function arrEq(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export default function useTagAutocomplete({
  eventId,
  query,
  delay = 250,
  max = 8,
  exclude = [],
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const lastCommittedRef = useRef([]); // for deduping setItems

  // Make exclude stable for deps
  const excludeKey = useMemo(() => {
    return (exclude || [])
      .map((x) => String(x).toLowerCase())
      .sort()
      .join("|");
  }, [exclude]);

  // Helper to apply excludes + slice + dedupe before setting state
  const applyAndSet = (src) => {
    const excl = new Set(excludeKey ? excludeKey.split("|") : []);
    const next = (src || [])
      .filter((t) => !excl.has(String(t).toLowerCase()))
      .slice(0, max);
    if (!arrEq(next, lastCommittedRef.current)) {
      lastCommittedRef.current = next;
      setItems(next);
    }
  };

  useEffect(() => {
    const q = (query || "").trim().toLowerCase();

    // reset on empty or missing event
    if (!eventId || !q) {
      // only update if not already empty
      if (lastCommittedRef.current.length) {
        lastCommittedRef.current = [];
        setItems([]);
      }
      if (controllerRef.current) controllerRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
      setLoading(false);
      return;
    }

    // Serve from cache immediately (best-effort, deduped)
    const cached = getCached(eventId, q);
    if (cached) applyAndSet(cached);

    // Debounce fetch for fresh results
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = new AbortController();
      setLoading(true);
      try {
        const tags = await suggestTags(eventId, q, { signal: controllerRef.current.signal });
        setCached(eventId, q, tags || []);
        applyAndSet(tags || []);
      } catch {
        // keep cached items; do nothing
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
    // Use excludeKey instead of exclude to avoid re-running every render
  }, [eventId, query, delay, max, excludeKey]);

  return { items, loading };
}



