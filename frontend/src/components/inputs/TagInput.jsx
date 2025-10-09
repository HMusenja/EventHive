import { useState } from "react";
import { Label } from "@/components/ui/label";

/**
 * TagInput
 * - Adds tags on Enter or comma
 * - Commits remaining text on blur
 * - Lowercases, trims, and de-dupes
 */
export default function TagInput({
  label,
  value = [],
  onChange,
  placeholder = "Type and press Enter",
  className = "",
  commitOnBlur = true,
}) {
  const [input, setInput] = useState("");

  const commit = (raw) => {
    const parts = String(raw)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!parts.length) return;
    const next = Array.from(new Set([...(value || []), ...parts]));
    onChange(next);
    setInput("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(input);
    } else if (e.key === "Backspace" && !input && value?.length) {
      // quick remove last tag for convenience
      onChange(value.slice(0, -1));
    }
  };

  const removeAt = (idx) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      {label ? <Label>{label}</Label> : null}

      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-2">
        {(value || []).map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs"
          >
            {t}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="opacity-60 hover:opacity-100"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          className="flex-1 bg-transparent outline-none text-sm min-w-[8ch]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => commitOnBlur && commit(input)}
          placeholder={placeholder}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Press <kbd>Enter</kbd> or type a comma to add.
      </p>
    </div>
  );
}
