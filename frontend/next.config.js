/** @type {import("next").NextConfig} */
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production (set it in Vercel Environment Variables).");
}

const nextConfig = {
  reactStrictMode: true
};

module.exports = nextConfig;
