import { useEffect, useMemo, useRef, useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import useTagAutocomplete from "@/hooks/useTagAutocomplete";
import { normalizeTag, isValidTag, splitPasted } from "@/utils/tagsClient";

const SOFT_LIMIT = 12;
const HARD_LIMIT = 12;

export default function InterestsStep({
  eventId,
  value,
  onChange,
  onBack,
  onSave,
  saving = false,
  error = "",
  setError,
  invalidTags = [],
  suggestedDefaults = [],
}) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // index in suggestions
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useId();

  const { items: suggestions, loading: suggLoading } = useTagAutocomplete({
    eventId,
    query: draft,
    exclude: value,
    max: 8,
  });

  // defaults shown as suggestions only; filter out already-selected and invalid
  const filteredDefaults = useMemo(() => {
    const chosen = new Set(value.map((t) => t.toLowerCase()));
    return (Array.isArray(suggestedDefaults) ? suggestedDefaults : [])
      .map(normalizeTag)
      .filter((t) => t && isValidTag(t) && !chosen.has(t.toLowerCase()))
      .slice(0, 12);
  }, [suggestedDefaults, value]);

  // open/close based on query & results
  useEffect(() => {
    const hasQuery = draft.trim().length > 0;
    setOpen(hasQuery && (suggLoading || suggestions.length > 0));
    // reset active whenever the list changes
    setActive((idx) => {
      const next = suggestions.length
        ? Math.min(idx, suggestions.length - 1)
        : -1;
      return next;
    });
  }, [draft, suggestions, suggLoading]);

  // close on outside click/blur (allow click selection via onMouseDown)
  function handleBlur() {
    // delay so click on suggestion can run first
    setTimeout(() => {
      if (!boxRef.current) return;
      const el = document.activeElement;
      if (!boxRef.current.contains(el)) setOpen(false);
    }, 0);
  }

  function addTag(raw) {
    const tag = normalizeTag(raw);
    if (!tag) return;
    if (!isValidTag(tag)) {
      setError?.("Use letters/numbers, spaces, or dashes (1–24 chars).");
      return;
    }
    if (value.some((t) => t.toLowerCase() === tag)) return;
    if (value.length >= HARD_LIMIT) return;
    setError?.("");
    onChange([...value, tag]);
    setDraft("");
    setActive(-1);
    // keep focus in input
    inputRef.current?.focus();
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag));
    inputRef.current?.focus();
  }

  function commitDraftIfAny() {
    if (draft.trim()) addTag(draft);
  }

  function handleKeyDown(e) {
    const count = suggestions.length;
    if (e.key === "ArrowDown" && open && count > 0) {
      e.preventDefault();
      setActive((i) => (i + 1) % count);
    } else if (e.key === "ArrowUp" && open && count > 0) {
      e.preventDefault();
      setActive((i) => (i - 1 + count) % count);
    } else if (e.key === "Enter") {
      if (open && count > 0 && active >= 0) {
        e.preventDefault();
        addTag(suggestions[active]);
        setOpen(false);
      } else if (draft.trim()) {
        e.preventDefault();
        addTag(draft);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === "Tab") {
      // Commit current token on Tab
      if (draft.trim()) {
        addTag(draft);
      }
    } else if (e.key === "Backspace" && !draft && value.length) {
      // Delete last chip when input is empty
      removeTag(value[value.length - 1]);
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData("text");
    const parts = splitPasted(text);
    if (!parts.length) return;
    e.preventDefault();
    for (const p of parts) {
      if (value.length >= HARD_LIMIT) break;
      addTag(p);
    }
  }

  const hint = useMemo(() => {
    if (value.length >= HARD_LIMIT) return "You've reached the limit (12).";
    if (value.length >= 10) return "You're near the limit (12).";
    return "Add topics you’d like to discuss.";
  }, [value.length]);

  const canSave = !saving && value.length <= HARD_LIMIT;

  return (
    <div className="w-full max-w-3xl mx-auto" ref={boxRef} onBlur={handleBlur}>
      <label className="block text-sm font-medium text-foreground mb-2">
        Interests
      </label>

      {/* combobox + chips */}
      <div
        className={`flex flex-wrap gap-2 rounded-md border p-2 focus-within:ring-2 focus-within:ring-ring ${
          value.length >= HARD_LIMIT ? "border-amber-600" : ""
        }`}
        role="combobox"
        aria-haspopup="listbox"
        aria-owns={listboxId}
        aria-expanded={open}
      >
        {value.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className="flex items-center gap-2"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="text-xs opacity-70 hover:opacity-100"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </Badge>
        ))}

        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setOpen(draft.trim().length > 0)}
          placeholder="e.g. ai, devops, design-systems…"
          className="flex-1 min-w-[200px] border-none shadow-none focus-visible:ring-0"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            open && active >= 0 ? `${listboxId}-opt-${active}` : undefined
          }
        />
      </div>

      <div className="mt-1 text-xs text-muted-foreground">
        {hint} {value.length}/{HARD_LIMIT}
      </div>
      {error && (
        <div className="text-xs text-destructive mt-1" aria-live="polite">
          {error}
        </div>
      )}
      {invalidTags?.length > 0 && (
        <div className="text-xs text-destructive mt-1" aria-live="polite">
          Invalid tags: {invalidTags.join(", ")}
        </div>
      )}

      {/* Suggested defaults (not auto-committed) */}
      {filteredDefaults.length > 0 && value.length < HARD_LIMIT && (
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-2">
            Suggested for you
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredDefaults.map((s) => (
              <button
                key={`def-${s}`}
                type="button"
                className="px-2 py-1 rounded-md border hover:bg-accent text-sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(s)}
                aria-label={`Add ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* suggestions from API */}
      {open && (suggLoading || suggestions.length > 0) && (
        <div
          id={listboxId}
          role="listbox"
          className="mt-2 rounded-md border p-2 text-sm max-h-56 overflow-auto"
        >
          {suggLoading ? (
            <div className="text-muted-foreground">Loading suggestions…</div>
          ) : (
            <ul>
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                >
                  <button
                    type="button"
                    className={`w-full text-left px-2 py-1 rounded-md hover:bg-accent ${
                      i === active ? "bg-accent" : ""
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      addTag(s);
                      setOpen(false);
                    }}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* actions */}
      <div className="mt-6 flex items-center gap-3">
        <Button variant="outline" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button onClick={() => onSave(value)} disabled={!canSave}>
          {saving ? "Saving…" : "Save & continue"}
        </Button>
      </div>
    </div>
  );
}
