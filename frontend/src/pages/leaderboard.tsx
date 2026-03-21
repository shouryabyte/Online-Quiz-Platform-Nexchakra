import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Crown, Medal } from "lucide-react";

import { Layout } from "../components/Layout";
import { getLeaderboard, getMyRank, type LeaderRow } from "../lib/api";

function medalIcon(rank: number) {
  if (rank === 1) return <Crown className="h-4 w-4 text-amber-200" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-200" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-orange-200" />;
  return null;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [lb, me] = await Promise.all([getLeaderboard(20), getMyRank()]);
        if (!alive) return;
        setRows(lb.leaderboard);
        setMyRank(me.rank);
        setMyId(me.me.id);
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
    <Layout>
      <section className="glass rounded-3xl p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Leaderboard</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Top players by XP. Your rank: {myRank ? <b>#{myRank}</b> : "â€”"}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            Rankings update instantly after quiz submission.
          </div>
        </div>

        {loading ? <p className="mt-6 text-sm text-white/70">Loadingâ€¦</p> : null}
        {error ? <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        {!loading && !error ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <div className="grid grid-cols-12 gap-0 px-5 py-3 text-xs font-semibold tracking-wide text-white/60">
              <div className="col-span-2">Rank</div>
              <div className="col-span-5">Player</div>
              <div className="col-span-2 text-right">XP</div>
              <div className="col-span-2 text-right">Quizzes</div>
              <div className="col-span-1 text-right">Acc</div>
            </div>

            <div className="divide-y divide-white/10">
              {rows.map((r) => {
                const isMe = myId && r.id === myId;
                return (
                  <div
                    key={r.id}
                    className={`grid grid-cols-12 items-center gap-0 px-5 py-4 transition-colors ${
                      isMe ? "bg-cyan-400/10" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="col-span-2 flex items-center gap-2 font-extrabold text-white">
                      <span className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5">#{r.rank}</span>
                      {medalIcon(r.rank)}
                    </div>

                    <div className="col-span-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 font-extrabold text-white">
                          {r.name?.slice(0, 1)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="font-extrabold text-white">{r.name}</div>
                          {isMe ? <div className="text-xs font-semibold text-cyan-200">You</div> : null}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 text-right font-extrabold text-white">{r.xp}</div>
                    <div className="col-span-2 text-right text-white/80">{r.quizzesTaken}</div>
                    <div className="col-span-1 text-right text-white/80">{r.accuracy}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </Layout>
  );
}