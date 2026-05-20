/**
 * Configuration du cookie de session NextAuth.
 *
 * Pour que la preview (servie sur un sous-domaine `*-preview.lumero.fr` par le
 * service preview-orchestrator) puisse vérifier l'identité du visiteur, le
 * cookie de session doit être partagé sur tout le domaine parent. On le scope
 * donc sur `AUTH_COOKIE_DOMAIN` (ex: `.lumero.fr`).
 */
export function authCookie() {
  const secure = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
  const domain = process.env.AUTH_COOKIE_DOMAIN || undefined;
  const name = `${secure ? "__Secure-" : ""}next-auth.session-token`;
  return { secure, domain, name };
}
