let appPromise = null;

async function getApp() {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    const [{ createApp }, { env }, { connectDb }] = await Promise.all([
      import("../src/app.js"),
      import("../src/config/env.js"),
      import("../src/db/connect.js")
    ]);

    await connectDb(env.MONGODB_URI);
    return createApp();
  })();

  return appPromise;
}

export default async function handler(req, res) {
  try {
    // Vercel catch-all routes sometimes pass the matched path via query string
    // (e.g. `?path=auth/login`) while `req.url` may be `/` or `/api`.
    // Our Express app mounts routes under `/api/*`, so reconstruct a stable URL.
    if (typeof req.url === "string") {
      const qIndex = req.url.indexOf("?");
      const pathname = qIndex >= 0 ? req.url.slice(0, qIndex) : req.url;
      const rawQuery = qIndex >= 0 ? req.url.slice(qIndex + 1) : "";
      const params = new URLSearchParams(rawQuery);
      const pathParam = params.get("path");

      if ((pathname === "" || pathname === "/" || pathname === "/api") && pathParam) {
        params.delete("path");
        const cleaned = params.toString();
        const normalizedPath = String(pathParam).replace(/^\/+/, "");
        req.url = `/api/${normalizedPath}${cleaned ? `?${cleaned}` : ""}`;
      } else if (!pathname.startsWith("/api")) {
        const suffix = pathname.startsWith("/") ? pathname : "/" + pathname;
        req.url = "/api" + suffix + (rawQuery ? `?${rawQuery}` : "");
      }
    }

    const app = await getApp();
    return app(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "SERVERLESS_INIT_FAILED" }));
  }
}