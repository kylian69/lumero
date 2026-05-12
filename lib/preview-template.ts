/**
 * Default preview template committed into each freshly-provisioned preview
 * repo. It's a minimal static site served by nginx — runs in seconds, works
 * out of the box, and can be replaced by the client (or the admin) with any
 * other stack later by editing the files in the preview branch.
 *
 * The orchestrator expects the container to listen on $PORT (default 3000)
 * and bind 0.0.0.0.
 */

export type TemplateFile = { path: string; content: string };

const DOCKERFILE = `# Preview Lumero — image par défaut.
# Sert le contenu de ./public via nginx sur le port \${PORT} (3000 par défaut).
# Remplace ce Dockerfile pour utiliser une autre stack (Next.js, Vite, …).
FROM nginx:1.27-alpine

ENV PORT=3000
EXPOSE 3000

# Template nginx interpolé au démarrage par l'image officielle
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Contenu statique du site
COPY public/ /usr/share/nginx/html/
`;

const NGINX_CONF = `server {
  listen       \${PORT} default_server;
  server_name  _;
  root         /usr/share/nginx/html;
  index        index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # En-têtes de sécurité minimaux
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
`;

const INDEX_HTML = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Preview — {{PROJECT_NAME}}</title>
  <style>
    :root {
      --bg: #0a0a0a;
      --panel: #111111;
      --text: #f5f5f5;
      --muted: #a3a3a3;
      --accent: #f59e0b;
      --border: #262626;
    }
    *,*::before,*::after { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; background: var(--bg); color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      -webkit-font-smoothing: antialiased; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 48px 24px; }
    .card { max-width: 640px; padding: 40px; background: var(--panel);
      border: 1px solid var(--border); border-radius: 16px; }
    .pill { display: inline-flex; align-items: center; gap: 8px; padding: 4px 10px;
      background: rgba(245, 158, 11, 0.1); color: var(--accent); font-size: 12px;
      border-radius: 999px; font-weight: 600; letter-spacing: 0.04em;
      text-transform: uppercase; }
    h1 { margin: 16px 0 12px; font-size: 1.75rem; }
    p { color: var(--muted); line-height: 1.6; margin: 0 0 12px; }
    code { background: #1f2937; padding: 2px 6px; border-radius: 6px;
      font-family: ui-monospace, "SF Mono", Consolas, monospace; font-size: 0.9em; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);
      font-size: 0.85rem; color: var(--muted); }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <span class="pill">Preview prête</span>
      <h1>Bienvenue sur ta preview Lumero</h1>
      <p>
        Cette page est le point de départ de ton site.
        L'équipe Lumero la remplacera progressivement par ton design final.
      </p>
      <p>
        Tu peux gérer cette preview (la mettre en veille, la réveiller) depuis
        ton <a href="https://lumero.fr/portal/project">espace client</a>.
      </p>
      <div class="footer">
        Servi par nginx — édite <code>public/index.html</code> dans le dépôt
        GitHub pour personnaliser cette page.
      </div>
    </div>
  </main>
</body>
</html>
`;

const README = `# Preview {{PROJECT_NAME}}

Repository auto-généré par Lumero. Branche \`preview\` = ce que voit ton client
sur <https://{{SLUG}}.preview.lumero.fr>.

## Structure

\`\`\`
.
├── Dockerfile              # nginx:alpine, écoute sur $PORT (3000)
├── nginx.conf.template     # config nginx (interpolée au démarrage)
└── public/
    └── index.html          # page d'accueil
\`\`\`

## Customisation

- **Modifier le site** : édite \`public/index.html\` (ou n'importe quel fichier
  dans \`public/\`). Chaque \`git push\` sur la branche \`preview\` déclenche un
  rebuild automatique de la preview.
- **Changer de stack** (Next.js, Vite, etc.) : remplace simplement le
  \`Dockerfile\` — l'orchestrateur le re-buildera. Le container doit écouter
  sur \`$PORT\` (3000) et binder \`0.0.0.0\`.

## Workflow admin Lumero

\`\`\`
git clone <ce-repo>
cd <ce-repo>
git checkout preview
# ... modifications ...
git push origin preview
\`\`\`

Le push déclenche un webhook → l'orchestrateur rebuild et redéploie la preview.
`;

export function defaultTemplate(opts: {
  slug: string;
  projectName: string;
}): TemplateFile[] {
  const subst = (s: string) =>
    s
      .replace(/\{\{SLUG\}\}/g, opts.slug)
      .replace(/\{\{PROJECT_NAME\}\}/g, opts.projectName);

  return [
    { path: "Dockerfile", content: DOCKERFILE },
    { path: "nginx.conf.template", content: NGINX_CONF },
    { path: "public/index.html", content: subst(INDEX_HTML) },
    { path: "README.md", content: subst(README) },
  ];
}
