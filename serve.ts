// Production static file server for TradeWorth (Vite SPA build).
// Serves the built client assets from dist/ on port 3000.
// Run `bun run build` before starting.

const PORT = 3000;
const HOST = "0.0.0.0";
const DIST_DIR = `${import.meta.dir}/dist`;

// Free PORT regardless of which user owns the current listener.
const freePort =
  `for _ in $(seq 1 25); do ` +
  `pids=$(lsof -t -iTCP:${String(PORT)} -sTCP:LISTEN 2>/dev/null || true); ` +
  `if [ -z "$pids" ]; then exit 0; fi; ` +
  `kill $pids 2>/dev/null || true; sleep 0.2; ` +
  `done`;

// MIME types for common static assets
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getMimeType(path: string): string {
  const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

for (let attempt = 1; ; attempt++) {
  await Bun.$`sudo sh -c ${freePort}`.quiet().nothrow();
  try {
    Bun.serve({
      port: PORT,
      hostname: HOST,
      async fetch(req) {
        const url = new URL(req.url);
        let pathname = url.pathname;

        // Serve static file
        let filePath = DIST_DIR + pathname;
        let file = Bun.file(filePath);

        // SPA fallback: serve index.html for non-file routes
        if (!(await file.exists())) {
          filePath = DIST_DIR + "/index.html";
          file = Bun.file(filePath);
        }

        if (await file.exists()) {
          return new Response(file, {
            headers: {
              "Content-Type": getMimeType(filePath),
              "Cache-Control":
                pathname.startsWith("/assets/")
                  ? "public, max-age=31536000, immutable"
                  : "no-cache",
            },
          });
        }

        return new Response("Not Found", { status: 404 });
      },
    });
    break;
  } catch (err) {
    if (attempt >= 10) throw err;
    await Bun.sleep(200);
  }
}

console.log(`TradeWorth serving on http://${HOST}:${String(PORT)}`);
