/**
 * Configuration du cookie de session NextAuth.
 *
 * Pour que la preview (servie sur un sous-domaine `*-preview.lumero.fr` par le
 * service preview-orchestrator) puisse vérifier l'identité du visiteur, le
 * cookie de session doit être partagé sur tout le domaine parent. On le scope
 * donc sur `AUTH_COOKIE_DOMAIN` (ex: `.lumero.fr`).
 *
 * `AUTH_COOKIE_PREFIX` permet d'isoler le cookie d'un environnement partageant
 * le même domaine parent (ex: staging sur `dev.lumero.fr` mais cookie scopé sur
 * `.lumero.fr` pour atteindre les previews) : un préfixe distinct évite que les
 * cookies prod et staging (même nom, même domaine, secrets différents) se
 * marchent dessus et provoquent des erreurs de déchiffrement.
 */
export function authCookie() {
  const secure = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
  const domain = process.env.AUTH_COOKIE_DOMAIN || undefined;
  const prefix = process.env.AUTH_COOKIE_PREFIX ?? "";
  const name = `${secure ? "__Secure-" : ""}${prefix}next-auth.session-token`;
  return { secure, domain, name };
}
