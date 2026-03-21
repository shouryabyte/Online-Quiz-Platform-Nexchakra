/*
  Vercel Serverless entry for the Express backend.

  Note: This repo's backend package is ESM (backend/package.json has "type": "module").
  Vercel Node functions support calling an Express app as the module export.
*/

let cached = globalThis.__quiz_platform_vercel_api__;
if (!cached) {
  cached = globalThis.__quiz_platform_vercel_api__ = { appPromise: null };
}

async function getApp() {
  if (cached.appPromise) return cached.appPromise;

  cached.appPromise = (async () => {
    // Import ESM backend entrypoints from the backend package.
    const [{ default: app }, { env }, { connectDb }] = await Promise.all([
      import("../backend/app.js"),
      import("../backend/src/config/env.js"),
      import("../backend/src/db/connect.js")
    ]);

    await connectDb(env.MONGODB_URI);
    return app;
  })();

  return cached.appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "SERVERLESS_INIT_FAILED" }));
  }
};