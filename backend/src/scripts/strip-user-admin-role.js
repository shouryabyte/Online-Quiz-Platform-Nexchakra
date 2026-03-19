import { env } from "../config/env.js";
import { connectDb } from "../db/connect.js";
import { User } from "../models/User.js";

async function run() {
  await connectDb(env.MONGODB_URI);

  const res = await User.updateMany({ roles: "admin" }, { $pull: { roles: "admin" } });

  // eslint-disable-next-line no-console
  console.log(`Updated users: matched=${res.matchedCount ?? res.n ?? 0} modified=${res.modifiedCount ?? res.nModified ?? 0}`);
}

run()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));