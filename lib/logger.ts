/**
 * Logger technique structuré, sans dépendance externe.
 *
 * En production : une ligne JSON par évènement sur stdout/stderr — facilement
 * ingérable par n'importe quel collecteur (Loki, Vector, journald, fichiers…)
 * tout en restant 100 % souverain et gratuit.
 * En développement : sortie lisible et colorée.
 *
 * Ce logger gère le flux « technique » (debug, traçage, erreurs runtime).
 * Le flux « métier / audit » est persisté en base via lib/log.ts.
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isProd = process.env.NODE_ENV === "production";
const minLevel: Level =
  (process.env.LOG_LEVEL as Level | undefined) ?? (isProd ? "info" : "debug");

const COLORS: Record<Level, string> = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";

function serialize(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
}

function emit(level: Level, msg: string, context?: Record<string, unknown>) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[minLevel]) return;

  const ctx = context
    ? Object.fromEntries(
        Object.entries(context).map(([k, v]) => [k, serialize(v)]),
      )
    : undefined;

  if (isProd) {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg,
      ...ctx,
    });
    (level === "error" ? process.stderr : process.stdout).write(line + "\n");
    return;
  }

  const color = COLORS[level];
  const prefix = `${color}[${level.toUpperCase()}]${RESET}`;
  if (ctx && Object.keys(ctx).length > 0) {
    console.log(prefix, msg, ctx);
  } else {
    console.log(prefix, msg);
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit("error", msg, ctx),
  /** Crée un logger enfant qui ajoute systématiquement un contexte. */
  child(base: Record<string, unknown>) {
    return {
      debug: (m: string, c?: Record<string, unknown>) => emit("debug", m, { ...base, ...c }),
      info: (m: string, c?: Record<string, unknown>) => emit("info", m, { ...base, ...c }),
      warn: (m: string, c?: Record<string, unknown>) => emit("warn", m, { ...base, ...c }),
      error: (m: string, c?: Record<string, unknown>) => emit("error", m, { ...base, ...c }),
    };
  },
};
