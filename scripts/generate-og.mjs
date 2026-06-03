// Génère public/og.png (1200x630) : image Open Graph / Twitter de partage.
// Utilise next/og (Satori) fourni avec Next 15. Aucune dépendance ajoutée.
import { ImageResponse } from "next/og.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import React from "react";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
mkdirSync(publicDir, { recursive: true });

const h = React.createElement;

const element = h(
  "div",
  {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "72px",
      background: "linear-gradient(135deg, #4347F3 0%, #2d1f8f 100%)",
      color: "#ffffff",
      fontFamily: "sans-serif",
    },
  },
  // Marque (carré + "L" + Lumero)
  h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: "24px" } },
    h(
      "div",
      {
        style: {
          width: "96px",
          height: "96px",
          borderRadius: "22px",
          background: "rgba(255,255,255,0.16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "60px",
          fontWeight: 800,
        },
      },
      "L"
    ),
    h("div", { style: { fontSize: "52px", fontWeight: 700 } }, "Lumero")
  ),
  // Titre + tagline
  h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "20px" } },
    h(
      "div",
      { style: { fontSize: "68px", fontWeight: 800, lineHeight: 1.1 } },
      "Création de site internet professionnel en 24h"
    ),
    h(
      "div",
      { style: { fontSize: "34px", color: "rgba(255,255,255,0.82)" } },
      "Plateforme française Website-as-a-Service · SEO inclus · À partir de 99€"
    )
  )
);

const img = new ImageResponse(element, { width: 1200, height: 630 });
const buf = Buffer.from(await img.arrayBuffer());
writeFileSync(join(publicDir, "og.png"), buf);
console.log(`og.png généré (${buf.length} octets) dans public/`);
