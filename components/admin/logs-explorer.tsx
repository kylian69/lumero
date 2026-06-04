"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Search, RefreshCw, ChevronDown, ChevronRight, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

type LogItem = {
  id: string;
  level: string;
  category: string;
  entityType: string;
  entityId: string;
  action: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
};

type ApiResponse = {
  items: LogItem[];
  total: number;
  page: number;
  pageCount: number;
  facets: {
    level: Record<string, number>;
    category: Record<string, number>;
  };
};

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

const LEVEL_VARIANT: Record<string, "neutral" | "warning" | "danger" | "info"> = {
  INFO: "info",
  WARN: "warning",
  ERROR: "danger",
  SECURITY: "danger",
};

export function LogsExplorer({
  initialCategory = "",
}: {
  initialCategory?: string;
}) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (level) params.set("level", level);
    if (category) params.set("category", category);
    if (entityType) params.set("entityType", entityType);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    return params;
  }, [q, level, category, entityType, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      params.set("page", String(page));
      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [buildParams, page]);

  const exportCsv = useCallback(() => {
    const params = buildParams();
    params.set("format", "csv");
    window.open(`/api/admin/logs?${params.toString()}`, "_blank");
  }, [buildParams]);

  // Recharge quand les filtres (hors recherche libre) changent.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, category, entityType, from, to, page]);

  // Debounce de la recherche plein-texte.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (action, message, email, IP, métadonnées…)"
            className="pl-9"
          />
        </div>
        <Select
          value={level}
          onChange={(e) => {
            setPage(1);
            setLevel(e.target.value);
          }}
          className="w-auto"
        >
          <option value="">Tous niveaux</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
        <Select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="w-auto"
        >
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Input
          value={entityType}
          onChange={(e) => {
            setPage(1);
            setEntityType(e.target.value);
          }}
          placeholder="Type d'entité"
          className="w-36"
        />
        <Input
          type="date"
          value={from}
          onChange={(e) => {
            setPage(1);
            setFrom(e.target.value);
          }}
          className="w-auto"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => {
            setPage(1);
            setTo(e.target.value);
          }}
          className="w-auto"
        />
        <Button variant="outline" onClick={() => load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button variant="outline" onClick={exportCsv} title="Exporter en CSV">
          <Download className="h-4 w-4" />
          CSV
        </Button>
      </div>

      {data && (
        <p className="text-sm text-muted-foreground">
          {data.total} évènement{data.total > 1 ? "s" : ""} — page {data.page}/
          {data.pageCount}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-8 px-3 py-2"></th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Niveau</th>
              <th className="px-3 py-2">Catégorie</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Entité</th>
              <th className="px-3 py-2">Acteur</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Aucun évènement ne correspond aux filtres.
                </td>
              </tr>
            )}
            {data?.items.map((it) => {
              const isOpen = expanded === it.id;
              return (
                <Fragment key={it.id}>
                  <tr
                    className="cursor-pointer border-t border-border/40 hover:bg-muted/30"
                    onClick={() => setExpanded(isOpen ? null : it.id)}
                  >
                    <td className="px-3 py-2 text-muted-foreground">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {formatDateTime(it.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={LEVEL_VARIANT[it.level] ?? "neutral"}>
                        {it.level}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="neutral">{it.category}</Badge>
                    </td>
                    <td className="px-3 py-2 font-medium">{it.action}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {it.entityType}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {it.user ? it.user.name || it.user.email : "Système / public"}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-border/40 bg-muted/20">
                      <td></td>
                      <td colSpan={6} className="px-3 py-3">
                        <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-1 text-xs">
                          {it.message && (
                            <>
                              <dt className="text-muted-foreground">Message</dt>
                              <dd>{it.message}</dd>
                            </>
                          )}
                          <dt className="text-muted-foreground">ID entité</dt>
                          <dd className="font-mono">{it.entityId}</dd>
                          {it.ip && (
                            <>
                              <dt className="text-muted-foreground">IP</dt>
                              <dd className="font-mono">{it.ip}</dd>
                            </>
                          )}
                          {it.userAgent && (
                            <>
                              <dt className="text-muted-foreground">User-Agent</dt>
                              <dd className="break-all">{it.userAgent}</dd>
                            </>
                          )}
                          {it.metadata && (
                            <>
                              <dt className="text-muted-foreground">Métadonnées</dt>
                              <dd>
                                <pre className="overflow-x-auto rounded bg-background p-2 font-mono text-[11px]">
                                  {JSON.stringify(it.metadata, null, 2)}
                                </pre>
                              </dd>
                            </>
                          )}
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
