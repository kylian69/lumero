"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as React from "react";

export type ProjectOption = {
  id: string;
  name: string;
  status: string;
};

export function ProjectSelector({
  projects,
  selectedId,
}: {
  projects: ProjectOption[];
  selectedId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const selected = projects.find((p) => p.id === selectedId) ?? projects[0];

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("projectId", id);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  if (projects.length <= 1) return null;

  return (
    <div ref={ref} className="relative mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2"
      >
        <Globe className="h-4 w-4 text-primary" />
        <span className="font-medium">{selected?.name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border border-border bg-popover shadow-lg">
          <p className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Mes projets ({projects.length})
          </p>
          <div className="py-1">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => select(p.id)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                  p.id === selected?.id ? "font-semibold text-primary" : ""
                }`}
              >
                <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
