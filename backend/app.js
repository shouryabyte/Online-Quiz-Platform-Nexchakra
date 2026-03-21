import { createApp } from "./src/app.js";

// Export an Express app instance for Vercel serverless.
// IMPORTANT: Do not call app.listen() in this file.
const app = createApp();

export default app;
export { createApp };