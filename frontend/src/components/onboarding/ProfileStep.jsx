import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const BIO_MAX = 1000;

function getInitials(name) {
  const n = String(name || "").trim();
  if (!n) return "👤";
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("") || "👤";
}

export default function ProfileStep({
  name = "",
  avatar = "",
  bio = "",
  onBioChange,
  onContinue,
  onSkip,
  busy = false,
}) {
  const len = bio.length;
  const over = len > BIO_MAX;
  const near = !over && len >= 900;

  const bioId = "onboard-bio";
  const helpId = "onboard-bio-help";
  const errId = "onboard-bio-error";

  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <div className="w-full max-w-3xl">
      {/* Read-only identity block */}
      <div className="flex items-center gap-4">
        {/* Avatar with fallback to initials */}
        <div
          className="h-14 w-14 rounded-full overflow-hidden bg-muted flex items-center justify-center select-none"
          role="img"
          aria-label={name ? `Avatar for ${name}` : "Avatar"}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={name ? `Avatar for ${name}` : "Avatar"}
              className="h-full w-full object-cover"
              onError={(e) => {
                // hide broken image and show initials fallback
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement?.classList.add("bg-muted");
                e.currentTarget.parentElement?.insertAdjacentHTML(
                  "beforeend",
                  `<span class="text-sm font-semibold text-foreground/70">${initials}</span>`
                );
              }}
            />
          ) : (
            <span className="text-sm font-semibold text-foreground/70">{initials}</span>
          )}
        </div>

        <div className="min-w-0">
          <div className="font-medium leading-tight truncate">{name || "Your name"}</div>
          <div className="text-xs text-muted-foreground">Visible to other attendees</div>
        </div>
      </div>

      {/* Bio input */}
      <div className="mt-6">
        <label htmlFor={bioId} className="block text-sm font-medium">
          Short bio
        </label>
        <Textarea
          id={bioId}
          value={bio}
          onChange={(e) => onBioChange?.(e.target.value)}
          placeholder="Tell people what you’re into, what you’re looking to discuss, etc."
          className={`mt-2 min-h-[120px] ${over ? "border-destructive focus-visible:ring-destructive" : ""}`}
          aria-invalid={over ? "true" : "false"}
          aria-describedby={`${helpId}${over ? ` ${errId}` : ""}`}
        />
        <div id={helpId} className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            {near ? "You’re near the limit." : "A sentence or two is plenty."}
          </span>
          <span aria-live="polite">
            {len} / {BIO_MAX}
          </span>
        </div>
        {over && (
          <div id={errId} className="mt-1 text-xs text-destructive" aria-live="assertive">
            Bio is too long. Please keep it under {BIO_MAX} characters.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={onContinue} disabled={busy || over}>
          {busy ? "Saving…" : "Continue"}
        </Button>
        <Button variant="outline" onClick={onSkip} disabled={busy}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
