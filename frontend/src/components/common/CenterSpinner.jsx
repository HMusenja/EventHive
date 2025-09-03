// src/components/common/CenterSpinner.jsx
export default function CenterSpinner({ label = "Loading…" }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground">
      <span className="animate-pulse">{label}</span>
    </div>
  );
}
