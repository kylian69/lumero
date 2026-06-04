import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const LEVELS = ["INFO", "WARN", "ERROR", "SECURITY"] as const;
const CATEGORIES = [
  "AUTH",
  "ACCOUNT",
  "CRM",
  "PROJECT",
  "BILLING",
  "SUPPORT",
  "CUSTOMIZATION",
  "SYSTEM",
  "GENERAL",
] as const;

const querySchema = z.object({
  q: z.string().trim().max(200).optional(),
  level: z.enum(LEVELS).optional(),
  category: z.enum(CATEGORIES).optional(),
  entityType: z.string().trim().max(80).optional(),
  action: z.string().trim().max(80).optional(),
  userId: z.string().trim().max(80).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  format: z.enum(["json", "csv"]).default("json"),
});

const CSV_MAX_ROWS = 10_000;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const f = parsed.data;

  const where: Prisma.ActivityLogWhereInput = {};
  if (f.level) where.level = f.level;
  if (f.category) where.category = f.category;
  if (f.entityType) where.entityType = f.entityType;
  if (f.action) where.action = f.action;
  if (f.userId) where.userId = f.userId;
  if (f.from || f.to) {
    where.createdAt = {};
    if (f.from) where.createdAt.gte = new Date(f.from);
    if (f.to) where.createdAt.lte = new Date(f.to);
  }
  if (f.q) {
    const contains = { contains: f.q, mode: "insensitive" as const };
    where.OR = [
      { action: contains },
      { message: contains },
      { entityType: contains },
      { entityId: contains },
      { metadata: { contains: f.q } },
      { ip: contains },
      { user: { is: { email: contains } } },
      { user: { is: { name: contains } } },
    ];
  }

  if (f.format === "csv") {
    const rows = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: CSV_MAX_ROWS,
      include: { user: { select: { name: true, email: true } } },
    });
    const header = [
      "createdAt",
      "level",
      "category",
      "entityType",
      "entityId",
      "action",
      "message",
      "user",
      "ip",
      "userAgent",
      "metadata",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [
          csvCell(r.createdAt.toISOString()),
          csvCell(r.level),
          csvCell(r.category),
          csvCell(r.entityType),
          csvCell(r.entityId),
          csvCell(r.action),
          csvCell(r.message),
          csvCell(r.user ? r.user.name || r.user.email : ""),
          csvCell(r.ip),
          csvCell(r.userAgent),
          csvCell(r.metadata),
        ].join(","),
      );
    }
    const csv = "﻿" + lines.join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const [total, rows, byLevel, byCategory] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.activityLog.groupBy({ by: ["level"], where, _count: true }),
    prisma.activityLog.groupBy({ by: ["category"], where, _count: true }),
  ]);

  const items = rows.map((r) => {
    let metadata: Record<string, unknown> | null = null;
    if (r.metadata) {
      try {
        metadata = JSON.parse(r.metadata);
      } catch {
        metadata = null;
      }
    }
    return {
      id: r.id,
      level: r.level,
      category: r.category,
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      message: r.message,
      metadata,
      ip: r.ip,
      userAgent: r.userAgent,
      createdAt: r.createdAt,
      user: r.user,
    };
  });

  return NextResponse.json({
    items,
    total,
    page: f.page,
    pageSize: f.pageSize,
    pageCount: Math.max(1, Math.ceil(total / f.pageSize)),
    facets: {
      level: Object.fromEntries(byLevel.map((b) => [b.level, b._count])),
      category: Object.fromEntries(byCategory.map((b) => [b.category, b._count])),
    },
  });
}
