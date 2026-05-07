"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/lib/faq-data";

type Props = {
  items: FaqItem[];
  groupTitle?: string;
};

export function FaqAccordion({ items, groupTitle }: Props) {
  return (
    <div className="space-y-3">
      {groupTitle ? (
        <h3 className="text-xl font-semibold tracking-tight">{groupTitle}</h3>
      ) : null}
      <ul className="space-y-3">
        {items.map((item, i) => (
          <motion.li
            key={item.question}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.2) }}
          >
            <details
              className={cn(
                "group rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-colors",
                "open:border-primary/40 open:bg-card"
              )}
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <h4 className="text-base font-semibold leading-snug tracking-tight sm:text-lg">
                  {item.question}
                </h4>
                <ChevronDown
                  className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                {item.answer}
              </div>
            </details>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
