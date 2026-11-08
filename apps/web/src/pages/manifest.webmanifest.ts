import type { APIRoute } from "astro";
import { SITE, THEME_COLOR } from "../config/site";

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: `${SITE.name}: oefenen voor het inburgeringsexamen`,
        short_name: SITE.name,
        description: "Oefen voor het KNM-examen van de inburgering: korte lessen per thema met toetsen, een kennisbank en herhalen.",
        lang: "nl",
        id: "/nl/",
        start_url: "/nl/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: THEME_COLOR[SITE.palette],
        categories: ["education"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
        ],
        shortcuts: [
          { name: "Thema's", url: "/nl/study/" },
          { name: "Herhalen", url: "/nl/practice/" },
        ],
      },
      null,
      2,
    ),
    { headers: { "Content-Type": "application/manifest+json" } },
  );
