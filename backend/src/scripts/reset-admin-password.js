import { env } from "../config/env.js";
import { connectDb } from "../db/connect.js";
import { Admin } from "../models/Admin.js";
import { hashPassword } from "../utils/password.js";

async function run() {
  const email = (process.env.ADMIN_SEED_EMAIL || "").trim().toLowerCase();
  const password = (process.env.ADMIN_SEED_PASSWORD || "").trim();

  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.error("Missing ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD in backend/.env");
    process.exit(1);
  }

  await connectDb(env.MONGODB_URI);

  const admin = await Admin.findOne({ email });
  if (!admin) {
    // eslint-disable-next-line no-console
    console.error(`Admin not found: ${email}`);
    process.exit(1);
  }

  admin.passwordHash = await hashPassword(password);
  await admin.save();

  // eslint-disable-next-line no-console
  console.log(`Admin password reset: ${email}`);
}

run()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));