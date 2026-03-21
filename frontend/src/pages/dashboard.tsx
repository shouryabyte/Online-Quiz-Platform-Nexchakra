import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowRight, Flame, Target, Trophy, Zap } from "lucide-react";

import { Layout } from "../components/Layout";
import { getDashboard, logout, me, type DashboardStats, type RecentAttempt, type PublicUser } from "../lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attempts, setAttempts] = useState<RecentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        try {
          const u = await me();
          if (!alive) return;
          setUser(u.user);
        } catch {
          // ignore
        }
        const data = await getDashboard();
        if (!alive) return;
        setStats(data.stats);
        setAttempts(data.recentAttempts);
      } catch (err) {
        if (!alive) return;
        const message = err instanceof Error ? err.message : "LOAD_FAILED";
        if (message === "UNAUTHENTICATED") {
          await router.replace("/login");
          return;
        }
        setError(message);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <Layout
      user={user}
      onLogout={async () => {
        try {
          await logout();
        } finally {
          await router.push("/login");
        }
      }}
    >
      <section className="glass rounded-3xl p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Your stats update instantly after every quiz submission.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/quizzes"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500/90 via-fuchsia-500/80 to-cyan-400/80 px-5 py-3 text-sm font-extrabold text-white shadow-glow transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              Play a quiz
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:bg-white/10"
            >
              Leaderboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {loading ? <p className="mt-6 text-sm text-white/70">Loading...</p> : null}
        {error ? <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        {stats ? (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-white/60">Rank</div>
                  <div className="mt-2 text-2xl font-extrabold text-white">#{stats.rank}</div>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Trophy className="h-5 w-5 text-amber-200" />
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-white/60">XP</div>
                  <div className="mt-2 text-2xl font-extrabold text-white">{stats.xp}</div>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Zap className="h-5 w-5 text-cyan-200" />
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-white/60">Streak</div>
                  <div className="mt-2 text-2xl font-extrabold text-white">{stats.streak}d</div>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Flame className="h-5 w-5 text-rose-200" />
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-white/60">Accuracy</div>
                  <div className="mt-2 text-2xl font-extrabold text-white">{stats.accuracy}%</div>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Target className="h-5 w-5 text-purple-200" />
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {stats ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold tracking-wide text-white/60">Quizzes attempted</div>
              <div className="mt-2 text-2xl font-extrabold text-white">{stats.quizzesTaken}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold tracking-wide text-white/60">Last activity</div>
              <div className="mt-2 text-lg font-extrabold text-white">
                {stats.lastQuizAt ? formatDate(stats.lastQuizAt) : "-"}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-6 glass rounded-3xl p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">Recent attempts</h2>
            <p className="mt-2 text-sm text-white/70">Last 10 quizzes you played.</p>
          </div>
          <Link href="/quizzes" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            Play more <ArrowRight className="inline h-4 w-4" />
          </Link>
        </div>

        {!loading && attempts.length === 0 ? <p className="mt-6 text-sm text-white/70">No attempts yet.</p> : null}

        {attempts.length > 0 ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <div className="grid grid-cols-12 gap-0 px-5 py-3 text-xs font-semibold tracking-wide text-white/60">
              <div className="col-span-3">When</div>
              <div className="col-span-5">Quiz</div>
              <div className="col-span-2 text-right">Score</div>
              <div className="col-span-1 text-right">XP</div>
              <div className="col-span-1 text-right">Time</div>
            </div>
            <div className="divide-y divide-white/10">
              {attempts.map((a) => (
                <div key={a.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/5">
                  <div className="col-span-3 text-sm text-white/70">{formatDate(a.createdAt)}</div>
                  <div className="col-span-5">
                    {a.quiz ? (
                      <div>
                        <div className="font-extrabold text-white">{a.quiz.title}</div>
                        <div className="text-xs font-semibold text-white/55">
                          {a.quiz.category} • {a.quiz.difficulty}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-white/60">(deleted quiz)</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right text-sm font-extrabold text-white">
                    {a.correctCount}/{a.totalQuestions}
                  </div>
                  <div className="col-span-1 text-right text-sm text-white/80">+{a.xpAwarded}</div>
                  <div className="col-span-1 text-right text-sm text-white/80">{Math.round(a.timeTakenSec)}s</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </Layout>
  );
}