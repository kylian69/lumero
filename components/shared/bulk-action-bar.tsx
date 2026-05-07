"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BulkActionBarProps = {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
};

export function BulkActionBar({ count, onClear, children }: BulkActionBarProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-2xl shadow-primary/10 backdrop-blur">
            <span className="min-w-max text-sm font-medium text-foreground">
              {count} sélectionné{count > 1 ? "s" : ""}
            </span>
            <div className="h-4 w-px bg-border/60" />
            <div className="flex flex-wrap items-center gap-2">{children}</div>
            <div className="h-4 w-px bg-border/60" />
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Désélectionner tout"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
