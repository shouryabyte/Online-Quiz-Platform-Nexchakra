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