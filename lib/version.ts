// Application version metadata.
// At build time, CI injects NEXT_PUBLIC_APP_VERSION / _COMMIT / _DATE / _CHANNEL
// (see scripts/compute-version.mjs and .github/workflows/docker-build.yml).
// In dev these fall back to package.json's version + a "dev" marker.

import pkg from "../package.json";

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || pkg.version;
export const APP_COMMIT = process.env.NEXT_PUBLIC_APP_COMMIT || "dev";
export const APP_BUILD_DATE = process.env.NEXT_PUBLIC_APP_BUILD_DATE || "";
export const APP_CHANNEL = process.env.NEXT_PUBLIC_APP_CHANNEL || "dev";
