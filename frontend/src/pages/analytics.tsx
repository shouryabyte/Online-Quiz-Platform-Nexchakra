import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Layout } from "../components/Layout";
import { getMyAnalytics, logout, me, type Analytics as AnalyticsType, type PublicUser } from "../lib/api";

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [data, setData] = useState<AnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [u, a] = await Promise.all([me(), getMyAnalytics()]);
        if (!alive) return;
        setUser(u.user);
        setData(a);
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
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Analytics</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Topic strengths, accuracy, and speed metrics.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            <BarChart3 className="h-4 w-4 text-cyan-200" />
            Advanced analytics can be monetized via Premium.
          </div>
        </div>

        {loading ? <p className="mt-6 text-sm text-white/70">Loading...</p> : null}
        {error ? <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        {data ? (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs font-semibold tracking-wide text-white/60">Attempts</div>
                <div className="mt-2 text-2xl font-extrabold text-white">{data.overview.attempts}</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs font-semibold tracking-wide text-white/60">Overall accuracy</div>
                <div className="mt-2 text-2xl font-extrabold text-white">{data.overview.accuracy}%</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs font-semibold tracking-wide text-white/60">Avg sec/question</div>
                <div className="mt-2 text-2xl font-extrabold text-white">{data.overview.avgSecPerQuestion}s</div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div className="grid grid-cols-12 gap-0 px-5 py-3 text-xs font-semibold tracking-wide text-white/60">
                <div className="col-span-5">Topic</div>
                <div className="col-span-4">Progress</div>
                <div className="col-span-1 text-right">Acc</div>
                <div className="col-span-2 text-right">Answered</div>
              </div>
              <div className="divide-y divide-white/10">
                {data.topicStats.map((t) => (
                  <div key={t.topic} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/5">
                    <div className="col-span-5 font-extrabold text-white">{t.topic}</div>
                    <div className="col-span-4">
                      <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400"
                          style={{ width: `${t.accuracy}%` }}
                        />
                      </div>
                    </div>
                    <div className="col-span-1 text-right text-sm font-extrabold text-white">{t.accuracy}%</div>
                    <div className="col-span-2 text-right text-sm text-white/80">{t.total}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Link href="/quizzes" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
                Improve weak topics <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : null}
      </section>
    </Layout>
  );
}