import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-lg font-semibold tracking-tight",
        className
      )}
    >
      <span
        aria-hidden
        className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
      >
        <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
        <span className="relative text-sm font-bold">L</span>
      </span>
      Lumero
    </span>
  );
}
