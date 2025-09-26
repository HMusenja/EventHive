import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

export default function InterestsEditor({ value = [], onChange, max = 25, maxLen = 30 }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const tags = useMemo(() => Array.isArray(value) ? value : [], [value]);

  function addTag(raw) {
    const t = String(raw).trim().toLowerCase();
    if (!t || t.length > maxLen) return;
    if (tags.includes(t)) return;
    if (tags.length >= max) return;
    onChange?.([...tags, t]);
    setInput("");
  }

  function removeTag(t) {
    onChange?.(tags.filter(x => x !== t));
    inputRef.current?.focus();
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="rounded-lg border p-2">
      <div className="flex flex-wrap gap-2">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="ml-1 opacity-70 hover:opacity-100"
              aria-label={`Remove ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={tags.length ? "" : "Add interests… (press Enter)"}
          className="flex-1 min-w-[160px] bg-transparent outline-none text-sm px-2 py-1"
          maxLength={maxLen}
        />
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {tags.length}/{max} tags • max {maxLen} chars each
      </div>
    </div>
  );
}
