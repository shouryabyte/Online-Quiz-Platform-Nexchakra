import mongoose from "mongoose";

const globalKey = "__quiz_platform_mongoose__";

export async function connectDb(mongoUri) {
  mongoose.set("strictQuery", true);

  const g = globalThis;
  if (!g[globalKey]) {
    g[globalKey] = { conn: null, promise: null };
  }

  const cached = g[globalKey];

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}