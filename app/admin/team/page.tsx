import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Équipe"
        description="Membres de l'équipe Lumero ayant accès à la console admin."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Administrateurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {admins.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {(a.name || a.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{a.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="default">Admin</Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  depuis {formatDate(a.createdAt)}
                </p>
              </div>
            </div>
          ))}
          <p className="mt-4 text-xs text-muted-foreground">
            Pour ajouter un administrateur, utilisez la commande CLI :
            <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px]">
              npm run create-admin
            </code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
