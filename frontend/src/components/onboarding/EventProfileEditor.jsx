import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import  useTagAutocomplete from "../../hooks/useTagAutocomplete.js"

const MAX_BIO = 1000;
const HARD_CAP_TAGS = 12;
const TAG_RE = /^[a-z0-9][a-z0-9 -]{0,23}$/i;

function normTag(v = "") {
  // normalize to lowercase, single-spaced, trimmed
  return v
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 -]/g, "")
    .trim();
}

export default function EventProfileEditor({
  eventId,
  initialBio = "",
  initialInterests = [],
  onCancel,
  onSaved,
  isSaving = false,
  serverErrors = null, // shape: { bio?:string, interests?:string, invalidTags?:string[] }
}) {
  const [bio, setBio] = useState(initialBio);
  const [tags, setTags] = useState(initialInterests.slice(0, HARD_CAP_TAGS));
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  // client-side errors
  const [bioErr, setBioErr] = useState("");
  const [tagsErr, setTagsErr] = useState("");

  // autocomplete
  const query = input.trim().toLowerCase();
  const { suggestions, loading } = useTagAutocomplete(query);

  // focus stays on input after add/remove
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [tags]);

  // sync serverErrors (e.g., invalidTags) into inline error
  useEffect(() => {
    if (!serverErrors) return;
    setBioErr(serverErrors.bio || "");
    if (serverErrors.invalidTags?.length) {
      setTagsErr(
        `Some tags are invalid: ${serverErrors.invalidTags.join(", ")}`
      );
    } else {
      setTagsErr(serverErrors.interests || "");
    }
  }, [serverErrors]);

  const remaining = MAX_BIO - bio.length;
  const canAddMore = tags.length < HARD_CAP_TAGS;

  function addTag(raw) {
    if (!canAddMore) return;
    const t = normTag(raw);
    if (!t) return;
    if (!TAG_RE.test(t)) {
      setTagsErr(
        "Tags must be 1–24 chars and use letters, numbers, spaces, or hyphens."
      );
      return;
    }
    if (tags.includes(t)) {
      setTagsErr("Tag already added.");
      return;
    }
    setTagsErr("");
    setTags((prev) => [...prev, t]);
    setInput("");
  }

  function removeTag(idx) {
    setTagsErr("");
    setTags((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) addTag(input);
    } else if (e.key === "Backspace" && !input) {
      // delete last when input empty
      if (tags.length) removeTag(tags.length - 1);
    } else if (e.key === "Escape") {
      setInput("");
    }
  }

  function handleBioChange(v) {
    setBio(v.slice(0, MAX_BIO));
    if (v.length > MAX_BIO) setBioErr(`Bio cannot exceed ${MAX_BIO} characters.`);
    else setBioErr("");
  }

  // “Suggested for you” — just show autocomplete top results; click to add
  const suggested = useMemo(() => {
    // don’t show suggestions that are already in user list
    return (suggestions || []).filter((s) => !tags.includes(s)).slice(0, 8);
  }, [suggestions, tags]);

  function handleSave() {
    // Validate client-side first
    if (bio.length > MAX_BIO) {
      setBioErr(`Bio cannot exceed ${MAX_BIO} characters.`);
      return;
    }
    if (tags.length > HARD_CAP_TAGS) {
      setTagsErr(`You can add up to ${HARD_CAP_TAGS} interests.`);
      return;
    }
    onSaved?.({ bio, interests: tags });
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Bio */}
        <div>
          <label htmlFor="bio" className="text-sm font-medium">
            Bio
          </label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => handleBioChange(e.target.value)}
            placeholder="Tell others about your role, interests, what you’re looking for…"
            className={cn("mt-2", bioErr && "border-destructive")}
            aria-invalid={!!bioErr}
            aria-describedby="bio-help bio-err"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span id="bio-help">Max {MAX_BIO} characters.</span>
            <span id="bio-counter" aria-live="polite">
              {remaining} left
            </span>
          </div>
          {bioErr && (
            <p id="bio-err" className="mt-1 text-xs text-destructive">
              {bioErr}
            </p>
          )}
        </div>

        {/* Interests */}
        <div>
          <div className="flex items-end justify-between">
            <label htmlFor="interests" className="text-sm font-medium">
              Interests
            </label>
            <span className="text-xs text-muted-foreground">
              {tags.length}/{HARD_CAP_TAGS}
            </span>
          </div>

          {/* Current tags */}
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <Badge key={`${t}-${i}`} variant="secondary" className="pr-0">
                <span className="mr-1">{t}</span>
                <button
                  type="button"
                  aria-label={`Remove ${t}`}
                  onClick={() => removeTag(i)}
                  className="ml-1 inline-flex h-5 px-2 rounded-r hover:bg-muted"
                >
                  ×
                </button>
              </Badge>
            ))}
            {tags.length === 0 && (
              <span className="text-sm text-muted-foreground">No interests yet.</span>
            )}
          </div>

          {/* Token input */}
          <Input
            id="interests"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a topic (e.g., react, fintech, ai) and press Enter"
            className={cn("mt-3", tagsErr && "border-destructive")}
            aria-invalid={!!tagsErr}
            aria-describedby="tags-err"
          />
          {tagsErr && (
            <p id="tags-err" className="mt-1 text-xs text-destructive">
              {tagsErr}
            </p>
          )}

          {/* Suggestions (click to add) */}
          <div className="mt-3">
            <div className="text-xs font-medium mb-2">Suggested for you</div>
            <div className="flex flex-wrap gap-2">
              {loading && <span className="text-xs text-muted-foreground">Loading…</span>}
              {!loading && suggested.length === 0 && (
                <span className="text-xs text-muted-foreground">No suggestions right now.</span>
              )}
              {!loading &&
                suggested.map((s, i) => (
                  <Button
                    key={`${s}-${i}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(s)}
                    disabled={!canAddMore}
                  >
                    + {s}
                  </Button>
                ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

