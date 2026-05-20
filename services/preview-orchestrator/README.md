# preview-orchestrator

Self-hosted replacement for Vercel preview environments. Provisions, builds,
starts and stops one Docker container per client preview, exposes them via
Cloudflare Tunnel using a hostname provided by Lume at provision time
(e.g. `<slug>-<id6>-preview.lumero.fr`), and auto-stops idle previews after a
configurable number of days.

## Architecture

```
GitHub push → /webhook/github      ┐
Lume admin/portal → /api/projects/*│→ orchestrator → docker.sock
client browser → <slug>.preview.lumero.fr ┘                ↓
                                          preview-<slug> container (1 per preview)
```

## Endpoints (internal, token-auth)

| Method | Path | Body | Effect |
|---|---|---|---|
| POST | `/api/projects` | `{id, slug, hostname, githubRepoFullName, githubBranch}` | Register a preview |
| GET  | `/api/projects/:id` | — | Status |
| POST | `/api/projects/:id/start` | — | Start (build first time) |
| POST | `/api/projects/:id/stop` | — | Stop the container |
| POST | `/api/projects/:id/redeploy` | — | Force git pull + rebuild + restart |
| DELETE | `/api/projects/:id` | — | Stop + remove container + image + workspace |

All `/api` routes require `x-internal-token: $INTERNAL_API_TOKEN`.

## Access control

Previews are private. Before proxying a request, the orchestrator calls the main
app's `GET /api/preview/authorize` (server-to-server, same `INTERNAL_API_TOKEN`,
relaying the visitor's cookie). Only the project owner, admins, or users with an
explicit grant may view the preview; everyone else is redirected to
`$MAIN_APP_PUBLIC_URL/preview-access`. Relevant env vars:

- `MAIN_APP_INTERNAL_URL` — internal URL of the app (default `http://app:3000`)
- `MAIN_APP_PUBLIC_URL` — public URL used for redirects (default `https://lumero.fr`)

This requires the session cookie to be shared across subdomains: set
`AUTH_COOKIE_DOMAIN=.lumero.fr` on the main app.

## Preview repos contract

Each client preview GitHub repo **must** contain a `Dockerfile` at its root.
The container is expected to listen on the port given via the `PORT` env var
(default 3000) and bind to `0.0.0.0`.

## Storage

- SQLite at `/data/orchestrator.db`
- Cloned repos at `/data/workspaces/<slug>/`

Mount `/data` as a Docker named volume for persistence.

## GitHub webhook (per preview repo)

Register a webhook in each preview repo:

- Payload URL: `https://preview.lumero.fr/webhook/github` (via tunnel)
- Content type: `application/json`
- Secret: `$GITHUB_WEBHOOK_SECRET`
- Events: just `push`
