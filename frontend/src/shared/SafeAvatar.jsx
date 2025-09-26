// src/components/shared/SafeAvatar.jsx
import { useState,useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";

export default function SafeAvatar({
  src,
  name = "",
  className = "h-8 w-8",
  ...rest
}) {
  const [broken, setBroken] = useState(false);

  // 🔁 Reset broken state whenever the src changes
  useEffect(() => {
    setBroken(false);
  }, [src]);

  const haveSrc = !!(src && typeof src === "string" && src.trim().length > 0);
  const useSrc = haveSrc && !broken ? src : "";

  return (
    <Avatar className={className}>
      {/* Only render <AvatarImage> when we actually have a URL to try */}
      {useSrc ? (
        <AvatarImage
          src={useSrc}
          alt={name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          {...rest}
        />
      ) : null}
      <AvatarFallback className="font-semibold">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}