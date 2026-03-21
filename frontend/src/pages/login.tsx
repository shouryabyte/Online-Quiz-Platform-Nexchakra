import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Github, Mail, Lock, Chrome, Shield, Eye, EyeOff } from "lucide-react";

import { Layout } from "../components/Layout";
import { login, oauthUrl } from "../lib/api";

function humanizeError(code: string) {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "Invalid email or password.";
    case "VALIDATION_ERROR":
      return "Please check the form inputs.";
    case "UNAUTHENTICATED":
      return "Please sign in.";
    default:
      return code.replace(/_/g, " ");
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length > 0 && !loading, [email, password, loading]);

  return (
    <Layout>
      <div className="mx-auto max-w-lg">
        <div className="glass relative overflow-hidden rounded-3xl p-7">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 animate-glow rounded-full bg-gradient-to-br from-purple-500/35 to-cyan-400/25 blur-3xl" />

          <div className="relative">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Sign in to continue your streak and climb the leaderboard.</p>

            <div className="mt-6 grid gap-3">
              <a
                className="group flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                href={oauthUrl("google")}
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <Chrome className="h-5 w-5 text-cyan-200" />
                  </span>
                  Continue with Google
                </span>
                <ArrowRight className="h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>

              <a
                className="group flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                href={oauthUrl("github")}
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <Github className="h-5 w-5 text-purple-200" />
                  </span>
                  Continue with GitHub
                </span>
                <ArrowRight className="h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-semibold tracking-wide text-white/50">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form
              className="grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!canSubmit) return;
                setError(null);
                setLoading(true);
                try {
                  await login({ email, password });
                  await router.push("/dashboard");
                } catch (err) {
                  const code = err instanceof Error ? err.message : "LOGIN_FAILED";
                  setError(humanizeError(code));
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
                    placeholder="you@example.com"
                    autoComplete="email"
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
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="rounded-xl p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500/90 via-fuchsia-500/80 to-cyan-400/80 px-6 py-3 text-sm font-extrabold text-white shadow-glow transition-all duration-300 enabled:hover:scale-[1.01] enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={!canSubmit}
              >
                {loading ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4 opacity-90 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>

              {error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white/60">
                    <Shield className="h-4 w-4 text-cyan-200" />
                    Admin access
                  </div>
                  <Link
                    href="/admin/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 transition-all duration-300 hover:bg-white/10"
                  >
                    Admin sign in <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">New here?</span>
                <Link href="/signup" className="inline-flex items-center gap-2 font-semibold text-cyan-200 hover:text-cyan-100">
                  Create account <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-white/50">
                <Mail className="h-3.5 w-3.5" />
                Email auth uses secure HTTP-only cookies.
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}