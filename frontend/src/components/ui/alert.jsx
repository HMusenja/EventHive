import React from "react";
import { cn } from "../../lib/utils";

/**
 * Alert component
 */
export function Alert({ children, className }) {
  return (
    <div className={cn("p-4 rounded border", className)}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, className }) {
  return (
    <div className={cn("text-sm text-gray-300", className)}>
      {children}
    </div>
  );
}
