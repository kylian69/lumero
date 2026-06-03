import { APP_VERSION, APP_COMMIT, APP_CHANNEL } from "@/lib/version";

export function VersionTag() {
  const isStable = APP_CHANNEL === "stable";
  const label = isStable ? `v${APP_VERSION}` : `v${APP_VERSION} · ${APP_CHANNEL}`;
  const title = `Version ${APP_VERSION} — commit ${APP_COMMIT} (${APP_CHANNEL})`;
  return (
    <div
      aria-label="Version de l'application"
      title={title}
      className="border-t border-border/40 py-3 text-center text-[11px] text-muted-foreground/70"
    >
      <span className="font-mono">{label}</span>
      <span aria-hidden="true"> · </span>
      <span className="font-mono opacity-70">{APP_COMMIT}</span>
    </div>
  );
}
