import { NextResponse } from "next/server";
import { z } from "zod";
import { recordLog } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * Point d'ingestion server-to-server pour les journaux émis par des services
 * internes (ex. preview-orchestrator). Authentifié par le même jeton partagé
 * que les autres échanges internes (`x-internal-token`).
 *
 * Permet de centraliser dans le Postgres principal les évènements des process
 * séparés (builds de preview, conteneurs Docker, erreurs…).
 */
const schema = z.object({
  level: z.enum(["INFO", "WARN", "ERROR", "SECURITY"]).optional(),
  category: z
    .enum([
      "AUTH",
      "ACCOUNT",
      "CRM",
      "PROJECT",
      "BILLING",
      "SUPPORT",
      "CUSTOMIZATION",
      "SYSTEM",
      "GENERAL",
    ])
    .optional(),
  entityType: z.string().min(1).max(80).default("system"),
  entityId: z.string().min(1).max(200).default("orchestrator"),
  action: z.string().min(1).max(120),
  message: z.string().max(2000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  source: z.string().max(80).default("orchestrator"),
});

export async function POST(req: Request) {
  const token = req.headers.get("x-internal-token");
  if (!token || token !== process.env.PREVIEW_INTERNAL_API_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  await recordLog({
    level: d.level,
    category: d.category ?? "SYSTEM",
    entityType: d.entityType,
    entityId: d.entityId,
    action: d.action,
    message: d.message,
    metadata: { ...(d.metadata ?? {}), source: d.source },
    // Les évènements externes peuvent eux aussi déclencher des alertes
    // (ex. erreurs répétées), donc on laisse les triggers actifs.
  });

  return NextResponse.json({ ok: true });
}
