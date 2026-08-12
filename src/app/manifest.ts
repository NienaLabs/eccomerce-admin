import type { MetadataRoute } from "next";

/**
 * Web app manifest. With this plus HTTPS and a service worker that has a fetch
 * handler, Chrome offers the install prompt and iOS honours "Add to Home
 * Screen" with the right icon, colours and standalone chrome.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AdminHub — Platform Control",
    short_name: "AdminHub",
    description:
      "Administer the marketplace: vendors, catalog, commissions, releases and support.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    // design.md §2: ink anchors the chrome, primary stays an accent.
    background_color: "#f5f5f0",
    theme_color: "#222022",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Android masks icons to the launcher's shape; the maskable variant keeps
      // the glyph inside the safe zone so it doesn't get cropped.
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Vendor approvals",
        url: "/vendors/approvals",
        description: "Review pending vendor applications",
      },
      {
        name: "Support tickets",
        url: "/tickets",
        description: "Open user and vendor tickets",
      },
      {
        name: "Orders",
        url: "/orders",
        description: "Monitor platform orders",
      },
    ],
  };
}
