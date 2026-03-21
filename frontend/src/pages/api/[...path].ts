import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false
  }
};

const hopByHop = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

function stripTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const target = process.env.API_PROXY_TARGET;
  if (!target) {
    return res.status(502).json({ error: "API_PROXY_TARGET_NOT_SET" });
  }

  const pathParts = Array.isArray(req.query.path) ? req.query.path : [];
  const path = pathParts.map((p) => encodeURIComponent(p)).join("/");
  const queryIndex = req.url ? req.url.indexOf("?") : -1;
  const query = queryIndex >= 0 && req.url ? req.url.slice(queryIndex) : "";

  const base = stripTrailingSlashes(target);
  const url = `${base}/api/${path}${query}`;

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (hopByHop.has(lower)) continue;
    if (lower === "host") continue;
    if (typeof value === "undefined") continue;
    headers[key] = Array.isArray(value) ? value.join(",") : value;
  }

  const method = req.method || "GET";
  const body = method === "GET" || method === "HEAD" ? undefined : await readRawBody(req);
  
  const upstream = await fetch(url, {
    method,
    headers,
    body: (body as unknown as any),
    redirect: "manual"
  });

  // status + headers
  res.status(upstream.status);
  for (const [key, value] of upstream.headers.entries()) {
    const lower = key.toLowerCase();
    if (hopByHop.has(lower)) continue;
    if (lower === "content-encoding") continue;
    if (lower === "content-length") continue;
    if (lower === "set-cookie") continue;
    res.setHeader(key, value);
  }

  // preserve multiple Set-Cookie headers when present
  const anyHeaders = upstream.headers as any;
  const setCookies: string[] | undefined = typeof anyHeaders.getSetCookie === "function" ? anyHeaders.getSetCookie() : undefined;
  if (setCookies && setCookies.length) {
    res.setHeader("Set-Cookie", setCookies);
  }

  if (upstream.status === 204) {
    return res.end();
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  return res.send(buf);
}
