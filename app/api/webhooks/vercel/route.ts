import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/accounts";

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret) return false;
  const digest = crypto
    .createHmac("sha1", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-vercel-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = payload.type as string | undefined;

  if (type !== "deployment.succeeded") {
    return NextResponse.json({ ok: true });
  }

  const deploymentPayload = payload.payload as Record<string, unknown> | undefined;
  const deployment = deploymentPayload?.deployment as Record<string, unknown> | undefined;
  const projectInfo = deploymentPayload?.project as Record<string, unknown> | undefined;
  const meta = deployment?.meta as Record<string, unknown> | undefined;

  const branch = meta?.githubCommitRef as string | undefined;
  const vercelProjectId = projectInfo?.id as string | undefined;
  const deploymentUrl = deployment?.url as string | undefined;

  // Only process preview branch deployments
  if (!branch || branch !== "preview") {
    return NextResponse.json({ ok: true });
  }

  if (!vercelProjectId || !deploymentUrl) {
    return NextResponse.json({ error: "Missing data in payload" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { vercelProjectId },
  });

  if (!project) {
    // Unknown project — not an error, just ignore
    return NextResponse.json({ ok: true });
  }

  await prisma.project.update({
    where: { id: project.id },
    data: {
      previewUrl: `https://${deploymentUrl}`,
      previewStatus: "READY",
    },
  });

  await logActivity({
    userId: null,
    entityType: "project",
    entityId: project.id,
    action: "preview_deployed",
    metadata: { deploymentUrl: `https://${deploymentUrl}`, branch },
  });

  return NextResponse.json({ ok: true });
}
