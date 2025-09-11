// src/components/onboarding/StepHeader.jsx
import { Badge } from "@/components/ui/badge";

export default function StepHeader({ step, total = 2, title, subtitle }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      <Badge variant="secondary" className="text-xs">
        Step {step} of {total}
      </Badge>
    </div>
  );
}
