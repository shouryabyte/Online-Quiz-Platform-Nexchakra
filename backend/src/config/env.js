import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  CLIENT_ORIGIN: z.string().url(),
  CLIENT_ORIGINS: z.string().optional(),
  AUTH_JWT_SECRET: z.string().min(32),
  AUTH_JWT_EXPIRES_IN: z.string().default("7d"),
  AUTH_COOKIE_NAME: z.string().default("qp_token"),
  ADMIN_COOKIE_NAME: z.string().default("qp_admin_token"),
  ADMIN_JWT_SECRET: z.string().min(32).optional(),
  ADMIN_JWT_EXPIRES_IN: z.string().default("7d"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama3-70b-8192"),
  GROQ_BASE_URL: z.string().default("https://api.groq.com/openai/v1"),
  GROQ_MAX_TOKENS: z.coerce.number().int().positive().default(1400),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid/missing environment variables.");
  // eslint-disable-next-line no-console
  console.error("Create `backend/.env` by copying `backend/.env.example`, then fill required values.");
  // eslint-disable-next-line no-console
  console.error("Problems:");
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".") || "(root)";
    // eslint-disable-next-line no-console
    console.error(`- ${key}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
