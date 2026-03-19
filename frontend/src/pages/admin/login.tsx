import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, Shield } from "lucide-react";

import { Layout } from "../../components/Layout";
import { adminLogin } from "../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Layout>
      <div className="mx-auto max-w-lg">
        <div className="glass relative overflow-hidden rounded-3xl p-7">
          <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 animate-glow rounded-full bg-gradient-to-br from-cyan-400/25 to-purple-500/35 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
              <Shield className="h-4 w-4 text-cyan-200" />
              Admin access
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Admin sign in</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Sign in with your admin credentials to manage quizzes and platform settings.</p>

            <form
              className="mt-6 grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setLoading(true);
                try {
                  await adminLogin({ email, password });
                  await router.push("/creator");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "LOGIN_FAILED");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <label className="text-xs font-semibold text-white/70">Email</label>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 focus-within:border-cyan-300/40 focus-within:bg-white/10">
                  <Mail className="h-4 w-4 text-white/60" />
                  <input
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70">Password</label>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 focus-within:border-cyan-300/40 focus-within:bg-white/10">
                  <Lock className="h-4 w-4 text-white/60" />
                  <input
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="********"
                    required
                  />
                </div>
              </div>

              <button
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500/90 via-fuchsia-500/80 to-cyan-400/80 px-6 py-3 text-sm font-extrabold text-white shadow-glow transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4 opacity-90 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>

              {error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Not an admin?</span>
                <Link href="/login" className="inline-flex items-center gap-2 font-semibold text-cyan-200 hover:text-cyan-100">
                  User sign in <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}