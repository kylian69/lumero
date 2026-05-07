"use client";

import { useState, useRef, useEffect } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";

interface InfoBadgeProps extends BadgeProps {
  label: string;
  description?: string;
}

export function InfoBadge({ label, description, ...badgeProps }: InfoBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <Badge
        {...badgeProps}
        title={description || undefined}
        onMouseEnter={() => description && setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => description && setOpen((v) => !v)}
        className={
          (badgeProps.className ? badgeProps.className + " " : "") +
          (description ? "cursor-help" : "")
        }
      >
        {label}
      </Badge>
      {open && description && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-max max-w-xs -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
        >
          {description}
        </span>
      )}
    </span>
  );
}
