import type { NextApiRequest, NextApiResponse } from "next";
import { pathToFileURL } from "url";
import * as fs from "fs";
import * as path from "path";

export const config = {
  api: {
    bodyParser: false
  }
};

let backendAppPromise: Promise<(req: any, res: any) => any> | null = null;

function getForwardedPath(req: NextApiRequest) {
  const parts = Array.isArray(req.query.path)
    ? req.query.path
    : typeof req.query.path === "string"
      ? [req.query.path]
      : [];

  let joined = parts.map((p) => String(p)).filter(Boolean).join("/");
  if (!joined) {
    const nxtPpath = (req.query as any).nxtPpath;
    if (typeof nxtPpath === "string" && nxtPpath) joined = nxtPpath;
  }
  if (!joined) {
    const rawUrl = req.url || "";
    const qIndex = rawUrl.indexOf("?");
    const pathname = qIndex >= 0 ? rawUrl.slice(0, qIndex) : rawUrl;
    joined = pathname.replace(/^\/api\/?/, "");
  }

  return joined.replace(/^\/+/, "");
}

function getForwardedQuery(req: NextApiRequest) {
  const rawUrl = req.url || "";
  const qIndex = rawUrl.indexOf("?");
  const rawQuery = qIndex >= 0 ? rawUrl.slice(qIndex + 1) : "";
  const params = new URLSearchParams(rawQuery);

  // Next/Vercel internal params for catch-all routing
  params.delete("path");
  params.delete("nxtPpath");

  // Debug flag (handled by proxy itself)
  params.delete("__debug");

  const query = params.toString();
  return query ? `?${query}` : "";
}

function isDebugRequest(req: NextApiRequest) {
  const q = (req.query as any).__debug;
  if (q === "1" || q === 1) return true;
  const header = req.headers["x-proxy-debug"];
  if (typeof header === "string" && header === "1") return true;
  if (Array.isArray(header) && header.includes("1")) return true;
  return process.env.PROXY_DEBUG === "1";
}

async function getBackendApp() {
  if (backendAppPromise) return backendAppPromise;

  backendAppPromise = (async () => {
    // Support Vercel Root Directory = `frontend` where `backend/` exists outside root,
    // with "Include files outside the root directory" enabled.
    const appCandidates = [
      path.resolve(process.cwd(), "backend", "src", "app.js"),
      path.resolve(process.cwd(), "..", "backend", "src", "app.js")
    ];

    const appPath = appCandidates.find((p) => fs.existsSync(p));
    if (!appPath) throw new Error("BACKEND_APP_NOT_FOUND");

    const envCandidates = [
      path.resolve(process.cwd(), "backend", "src", "config", "env.js"),
      path.resolve(process.cwd(), "..", "backend", "src", "config", "env.js")
    ];

    const envPath = envCandidates.find((p) => fs.existsSync(p));
    if (!envPath) throw new Error("BACKEND_ENV_NOT_FOUND");

    const dbCandidates = [
      path.resolve(process.cwd(), "backend", "src", "db", "connect.js"),
      path.resolve(process.cwd(), "..", "backend", "src", "db", "connect.js")
    ];

    const dbPath = dbCandidates.find((p) => fs.existsSync(p));
    if (!dbPath) throw new Error("BACKEND_DB_CONNECT_NOT_FOUND");

    const [{ createApp }, { env }, { connectDb }] = await Promise.all([
      import(pathToFileURL(appPath).href),
      import(pathToFileURL(envPath).href),
      import(pathToFileURL(dbPath).href)
    ]);

    await connectDb(env.MONGODB_URI);
    return createApp();
  })();

  return backendAppPromise;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const forwardedPath = getForwardedPath(req);
  const query = getForwardedQuery(req);
  const normalizedUrl = `/api${forwardedPath ? `/${forwardedPath}` : ""}${query}`;

  const debug = isDebugRequest(req);
  if (debug) {
    res.setHeader("x-api-mode", "local-backend");
    res.setHeader("x-api-path", forwardedPath || "");
    res.setHeader("x-api-url", normalizedUrl);

    if ((req.method || "GET") === "GET") {
      return res.status(200).json({ ok: true, mode: "local-backend", forwardedPath, url: normalizedUrl });
    }
  }

  // Ensure Express route matching sees `/api/...`.
  (req as any).url = normalizedUrl;

  const app = await getBackendApp();
  return app(req as any, res as any);
}