import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicUser } from "../lib/api";

export function Layout(props: { children: ReactNode; user?: PublicUser | null; onLogout?: () => void }) {
  const { children, user, onLogout } = props;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="sticky top-4 z-50">
          <nav className="glass rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <span className="h-3 w-3 rounded-full bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300" />
                  </span>
                  <span className="font-extrabold tracking-tight">NexChakra Quiz</span>
                </Link>

                <div className="hidden items-center gap-2 text-sm text-white/80 md:flex">
                  <Link href="/quizzes" className="rounded-xl px-3 py-2 transition-all hover:bg-white/5 hover:text-white">
                    Quizzes
                  </Link>
                  <Link href="/leaderboard" className="rounded-xl px-3 py-2 transition-all hover:bg-white/5 hover:text-white">
                    Leaderboard
                  </Link>
                  <Link href="/dashboard" className="rounded-xl px-3 py-2 transition-all hover:bg-white/5 hover:text-white">
                    Dashboard
                  </Link>
                  <Link href="/analytics" className="rounded-xl px-3 py-2 transition-all hover:bg-white/5 hover:text-white">
                    Analytics
                  </Link>
                  <Link href="/creator" className="rounded-xl px-3 py-2 transition-all hover:bg-white/5 hover:text-white">
                    Creator
                  </Link>
                  <Link href="/ai" className="rounded-xl px-3 py-2 transition-all hover:bg-white/5 hover:text-white">
                    AI
                  </Link>
                  <Link href="/pricing" className="rounded-xl px-3 py-2 transition-all hover:bg-white/5 hover:text-white">
                    Pricing
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {user?.name ? <span className="hidden text-sm text-white/70 sm:inline">Hi, {user.name}</span> : null}

                <div className="flex items-center gap-2">
                  {user ? (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition-all hover:bg-rose-500/15 hover:shadow-[0_0_0_1px_rgba(244,63,94,0.25),0_20px_60px_rgba(244,63,94,0.10)]"
                    >
                      Logout
                    </button>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 transition-all hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10)]"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="rounded-xl bg-gradient-to-r from-purple-500/90 via-fuchsia-500/80 to-cyan-400/80 px-4 py-2 text-sm font-bold text-white shadow-glow transition-all hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_24px_90px_rgba(0,194,255,0.22)] active:scale-[0.99]"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 md:hidden">
              <Link href="/quizzes" className="rounded-xl bg-white/5 px-3 py-2 text-center text-sm text-white/80">
                Quizzes
              </Link>
              <Link href="/leaderboard" className="rounded-xl bg-white/5 px-3 py-2 text-center text-sm text-white/80">
                Leaderboard
              </Link>
              <Link href="/dashboard" className="rounded-xl bg-white/5 px-3 py-2 text-center text-sm text-white/80">
                Dashboard
              </Link>
              <Link href="/analytics" className="rounded-xl bg-white/5 px-3 py-2 text-center text-sm text-white/80">
                Analytics
              </Link>
              <Link href="/creator" className="rounded-xl bg-white/5 px-3 py-2 text-center text-sm text-white/80">
                Creator
              </Link>
              <Link href="/ai" className="rounded-xl bg-white/5 px-3 py-2 text-center text-sm text-white/80">
                AI
              </Link>
              <Link href="/pricing" className="rounded-xl bg-white/5 px-3 py-2 text-center text-sm text-white/80">
                Pricing
              </Link>
              <Link href="/" className="rounded-xl bg-white/5 px-3 py-2 text-center text-sm text-white/80">
                Home
              </Link>
            </div>
          </nav>
        </div>

        <main className="pt-6">{children}</main>
      </div>
    </div>
  );
}