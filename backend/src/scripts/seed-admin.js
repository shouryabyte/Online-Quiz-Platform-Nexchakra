import { env } from "../config/env.js";
import { connectDb } from "../db/connect.js";
import { Admin } from "../models/Admin.js";
import { hashPassword } from "../utils/password.js";

async function seedAdmin() {
  const email = (process.env.ADMIN_SEED_EMAIL || "").trim().toLowerCase();
  const password = (process.env.ADMIN_SEED_PASSWORD || "").trim();
  const name = (process.env.ADMIN_SEED_NAME || "Admin").trim() || "Admin";

  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.error("Missing ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD in backend/.env");
    process.exit(1);
  }

  await connectDb(env.MONGODB_URI);

  const existing = await Admin.findOne({ email }).lean();
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`Seed skipped: admin already exists (${email}).`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await Admin.create({ name, email, passwordHash });

  // eslint-disable-next-line no-console
  console.log(`Seed complete: admin created (${email}).`);
}

seedAdmin()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));