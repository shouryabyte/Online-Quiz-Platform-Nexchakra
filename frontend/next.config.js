/** @type {import("next").NextConfig} */
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production (set it in Vercel Environment Variables).");
}

const apiProxyTarget = process.env.API_PROXY_TARGET;

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [{ source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` }];
  }
};

module.exports = nextConfig;
