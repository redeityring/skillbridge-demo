import type { NextConfig } from "next";

/**
 * Dev-server origins.
 *
 * WHY THIS EXISTS — it is not cosmetic.
 *
 * Next.js blocks cross-origin requests to dev-only assets (`/_next/*`). It
 * replies `403 Unauthorized` to anything whose Origin/Referer hostname is not
 * `localhost`, not a `localhost` subdomain, and not the hostname the server was
 * started with.
 *
 * Opening the app from a phone (http://192.168.x.x:3000) or from another
 * machine is therefore a *cross-origin* request. The HTML page still renders —
 * it is server-rendered — but every JS chunk is refused, React never hydrates,
 * and so no `onClick` handler is ever attached. The result looks like a working
 * page on which **every button is dead**. It is a silent, total failure of
 * interactivity that looks like a CSS or touch bug and is neither.
 *
 * Two rules matter when writing entries:
 *  1. Match on hostname ONLY — no scheme, no port, no path. `192.168.1.5`, not
 *     `http://192.168.1.5:3000`.
 *  2. `*` substitutes for exactly one hostname label, `**` for one or more
 *     (only allowed at the start). So `192.168.*.*` covers a whole /16 LAN.
 *
 * This applies to development only. `next build && next start` performs no such
 * check, which is why the README recommends demoing the production build.
 */
const LAN_ORIGINS = [
  // Private IPv4 ranges — phones and laptops on the same Wi-Fi.
  "192.168.*.*",
  "10.*.*.*",
  "172.*.*.*",
  // mDNS / Bonjour names, e.g. "MacBook-Pro.local", "DESKTOP-4F2A1B.local".
  "*.local",
  "*.localhost",
  // Common tunnels used to hand a reviewer a URL. `**` (not `*`) because these
  // hosts are often multi-label, e.g. "a1b2.us.ngrok-free.app".
  "**.trycloudflare.com",
  "**.ngrok-free.app",
  "**.ngrok.io",
  "**.loca.lt",
];

const nextConfig: NextConfig = {
  // The repo lives inside a user folder that also holds an unrelated lockfile;
  // pinning the root keeps Next from walking up the tree during builds.
  turbopack: {
    root: __dirname,
  },

  allowedDevOrigins: LAN_ORIGINS,
};

export default nextConfig;
