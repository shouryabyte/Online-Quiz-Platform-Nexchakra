import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { connectDb } from "../src/db/connect.js";

const app = createApp();

export default async function handler(req, res) {
  try {
    await connectDb(env.MONGODB_URI);
    return app(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "SERVERLESS_INIT_FAILED" }));
  }
}