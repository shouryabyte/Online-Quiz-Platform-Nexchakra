import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

import { Layout } from "../components/Layout";
import { aiGenerateQuiz, logout, me, type GeneratedQuiz, type PublicUser } from "../lib/api";

export default function AiPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [topic, setTopic] = useState("JavaScript");
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const u = await me();
        setUser(u.user);
      } catch {
        // ignore
      }
    })();
  }, []);

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
            <h1 className="text-3xl font-extrabold tracking-tight text-white">AI Quiz Generator</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Generate a quiz from any topic instantly.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            <Sparkles className="h-4 w-4 text-cyan-200" />
            Powered by Groq when configured
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-white/70">Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-300/40 focus:bg-white/10"
              placeholder="e.g., React, MongoDB, AI, Algebra"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="w-full rounded-2xl bg-gradient-to-r from-purple-500/90 via-fuchsia-500/80 to-cyan-400/80 px-6 py-3 text-sm font-extrabold text-white shadow-glow transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
              disabled={loading}
              onClick={async () => {
                setError(null);
                setLoading(true);
                try {
                  const res = await aiGenerateQuiz({ topic });
                  setQuiz(res.quiz);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "GENERATE_FAILED");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {error ? <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        {quiz ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-semibold text-white/70">Preview</div>
            <div className="mt-2 text-xl font-extrabold text-white">{quiz.title}</div>
            <div className="mt-2 text-sm text-white/70">{quiz.description}</div>

            <div className="mt-5 grid gap-3">
              {quiz.questions.map((q, idx) => (
                <div key={idx} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-extrabold text-white">Q{idx + 1}. {q.prompt}</div>
                  <ul className="mt-3 list-inside list-disc text-sm text-white/80">
                    {q.options.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/creator"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:bg-white/10"
              >
                Open Creator
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/quizzes"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:bg-white/10"
              >
                Play quizzes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </Layout>
  );
}