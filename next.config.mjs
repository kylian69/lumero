/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  compiler: {
    // En production on supprime les console.log de debug, mais on CONSERVE
    // console.error / console.warn — indispensables pour tracer les incidents
    // de paiement (webhooks Stripe) et autres erreurs serveur.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;
