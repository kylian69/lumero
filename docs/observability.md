# Observabilité & accès aux journaux

Lumero journalise sur **deux plans complémentaires** :

1. **Applicatif / audit** — table Postgres `ActivityLog`, consultable dans
   l'app via `/admin/logs` (recherche, filtres, export CSV) et exploitable par
   les déclencheurs (alertes sécurité, paiement, notifications admin).
2. **Technique** — chaque évènement est aussi émis en **JSON structuré sur
   stdout** (`lib/logger.ts`), capturé par Docker.

## Accès aux logs *en dehors* de l'application

Plusieurs chemins existent, du plus simple au plus complet, pour consulter les
logs même quand l'app (ou Postgres) ne répond plus.

### 1. Directement en base (app down, Postgres up)

L'UI `/admin/logs` n'est qu'une vue par-dessus Postgres. En cas de panne de
l'app :

```bash
psql "$DATABASE_URL" -c \
  "select \"createdAt\", level, category, action, message \
   from \"ActivityLog\" order by \"createdAt\" desc limit 100;"
```

### 2. Stdout des conteneurs (app crash/boucle)

```bash
docker logs --tail 200 -f lume-app
docker logs --tail 200 lume-preview-orchestrator
```

Le driver `json-file` (rotation configurée dans `docker-compose.prod.yml`)
conserve ces logs sur l'hôte.

### 3. Grafana + Loki (console d'analyse indépendante) — recommandé

La stack `loki` + `promtail` + `grafana` (voir `docker-compose.prod.yml`) tourne
dans des conteneurs séparés :

- **Promtail** découvre automatiquement tous les conteneurs via le socket
  Docker et expédie leur stdout à **Loki**, en étiquetant par `container`,
  `stream` et `level` (pour les logs JSON Lumero).
- **Loki** stocke les logs sur un volume dédié (`loki-data`), avec rétention.
- **Grafana** fournit l'UI de recherche/analyse — **indépendante de l'app** :
  elle reste debout même si l'app et Postgres sont à terre.

#### Accès à Grafana

Grafana est lié à la **loopback de l'hôte** (`127.0.0.1:3001`), donc non exposé
publiquement. On y accède par un tunnel SSH :

```bash
ssh -L 3001:127.0.0.1:3001 user@serveur
# puis ouvrir http://localhost:3001  (identifiants GRAFANA_ADMIN_*)
```

> **Staging** : la même stack est présente dans `docker-compose.staging.yml`,
> isolée (réseau `lume-staging`, volumes `*-staging`) et exposée sur le port
> `127.0.0.1:3002` pour pouvoir cohabiter avec la prod sur la même VM :
> `ssh -L 3002:127.0.0.1:3002 user@serveur` → `http://localhost:3002`.

La source de données Loki est provisionnée automatiquement
(`docker/grafana/provisioning/`). Exemples de requêtes LogQL dans Grafana →
Explore :

```logql
{container="lume-app"}                          # tout l'app
{container="lume-app"} | json | level="ERROR"   # erreurs uniquement
{container=~"lume-.*"} |= "stripe"              # recherche plein-texte
```

## Rétention

- **Postgres** : purge via `/api/cron/purge-logs` (planifiée par le cron de
  l'orchestrateur si `CRON_SECRET` est défini). Voir `LOG_RETENTION_*`.
- **Loki** : `retention_period` dans `docker/loki/loki-config.yml`.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `LOG_LEVEL` | Niveau min. du logger technique (`debug`…`error`) |
| `LOG_RETENTION_INFO_DAYS` / `LOG_RETENTION_AUDIT_DAYS` | Rétention Postgres |
| `CRON_SECRET` | Auth de la purge (identique app ↔ orchestrateur) |
| `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` | Accès à la console Grafana |
