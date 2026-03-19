import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowRight, Plus, Save, Upload, Trash2, Eye, EyeOff, Shield } from "lucide-react";

import { Layout } from "../components/Layout";
import {
  adminLogout,
  adminMe,
  creatorCreateQuiz,
  creatorDeleteQuiz,
  creatorGetQuiz,
  creatorImportCsv,
  creatorListQuizzes,
  creatorSetPublished,
  creatorSetQuestions,
  creatorUpdateQuiz,
  logout,
  me,
  type AdminSession,
  type CreatorQuestion,
  type CreatorQuiz,
  type CreatorQuizSummary,
  type PublicUser
} from "../lib/api";

function adminToUiUser(admin: AdminSession): PublicUser {
  return {
    id: admin.id,
    name: `${admin.name} (Admin)`,
    email: admin.email,
    avatarUrl: "",
    provider: "local",
    roles: ["admin"],
    xp: 0,
    level: 1,
    streak: 0,
    quizzesTaken: 0,
    accuracy: 0,
    badges: [],
    isPremium: true,
    premiumUntil: null
  };
}

export default function CreatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [list, setList] = useState<CreatorQuizSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<CreatorQuiz | null>(null);
  const [csv, setCsv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canUseCreator = useMemo(() => {
    if (admin) return true;
    const roles = user?.roles || [];
    return roles.includes("creator");
  }, [admin, user]);

  const layoutUser = admin ? adminToUiUser(admin) : user;

  async function refreshList() {
    const res = await creatorListQuizzes();
    setList(res.quizzes);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        try {
          const u = await me();
          if (!alive) return;
          setUser(u.user);
        } catch {
          // ignore
        }

        try {
          const a = await adminMe();
          if (!alive) return;
          setAdmin(a.admin);
        } catch {
          // ignore
        }

        const res = await creatorListQuizzes();
        if (!alive) return;
        setList(res.quizzes);
      } catch (err) {
        if (!alive) return;
        const message = err instanceof Error ? err.message : "LOAD_FAILED";
        setError(message);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setQuiz(null);
      return;
    }

    let alive = true;
    (async () => {
      try {
        const res = await creatorGetQuiz(selectedId);
        if (!alive) return;
        setQuiz(res.quiz);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "LOAD_FAILED");
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedId]);

  if (!loading && !layoutUser) {
    return (
      <Layout>
        <section className="glass rounded-3xl p-7">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Creator</h1>
          <p className="mt-3 text-sm text-white/70">Sign in to access quiz creation tools.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:bg-white/10"
            >
              User sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500/90 via-fuchsia-500/80 to-cyan-400/80 px-6 py-3 text-sm font-extrabold text-white shadow-glow transition-all duration-300 hover:scale-[1.01]"
            >
              <Shield className="h-4 w-4" />
              Admin sign in
            </Link>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
        </section>
      </Layout>
    );
  }

  if (!loading && layoutUser && !canUseCreator) {
    return (
      <Layout user={layoutUser}>
        <section className="glass rounded-3xl p-7">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Creator</h1>
          <p className="mt-3 text-sm text-white/70">You do not have creator access.</p>
          <p className="mt-3 text-sm text-white/70">Ask an admin to grant you the <code className="rounded bg-white/10 px-2 py-1">creator</code> role.</p>
          <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            Go back <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </Layout>
    );
  }

  return (
    <Layout
      user={layoutUser}
      onLogout={async () => {
        try {
          if (admin) await adminLogout();
          if (!admin) await logout();
        } finally {
          await router.push(admin ? "/admin/login" : "/login");
        }
      }}
    >
      <section className="glass rounded-3xl p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Creator</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Create, edit, import, and publish quizzes.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500/90 via-fuchsia-500/80 to-cyan-400/80 px-5 py-3 text-sm font-extrabold text-white shadow-glow transition-all duration-300 hover:scale-[1.01]"
            onClick={async () => {
              setError(null);
              try {
                const created = await creatorCreateQuiz({
                  title: "New Quiz",
                  description: "",
                  category: "Programming",
                  difficulty: "easy",
                  timeLimitSec: 300
                });
                await refreshList();
                setSelectedId(created.quizId);
              } catch (err) {
                setError(err instanceof Error ? err.message : "CREATE_FAILED");
              }
            }}
          >
            <Plus className="h-4 w-4" />
            New quiz
          </button>
        </div>

        {loading ? <p className="mt-6 text-sm text-white/70">Loading...</p> : null}
        {error ? <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:col-span-1">
            <div className="text-sm font-extrabold text-white">Your quizzes</div>
            <div className="mt-4 grid gap-2">
              {list.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">No quizzes yet.</div> : null}
              {list.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedId(q.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                    selectedId === q.id ? "border-cyan-300/40 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-extrabold text-white">{q.title}</div>
                    <span className={`rounded-xl px-2 py-1 text-xs font-semibold ${q.published ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-white/60"}`}>
                      {q.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-white/55">{q.category} • {q.difficulty} • {q.questionCount} Q</div>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            {quiz ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-white/60">Editing</div>
                    <div className="mt-2 text-2xl font-extrabold text-white">{quiz.title}</div>
                    <div className="mt-1 text-sm text-white/60">{quiz.category} • {quiz.difficulty} • {quiz.timeLimitSec}s</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setError(null);
                        try {
                          await creatorSetPublished(quiz.id, !quiz.published);
                          const refreshed = await creatorGetQuiz(quiz.id);
                          setQuiz(refreshed.quiz);
                          await refreshList();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "PUBLISH_FAILED");
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                    >
                      {quiz.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {quiz.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setError(null);
                        try {
                          await creatorDeleteQuiz(quiz.id);
                          setQuiz(null);
                          setSelectedId(null);
                          await refreshList();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "DELETE_FAILED");
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-500/15"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-8 grid gap-4">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="text-sm font-extrabold text-white">Quiz details</div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-white/70">Title</label>
                        <input
                          value={quiz.title}
                          onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40 focus:bg-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-white/70">Category</label>
                        <input
                          value={quiz.category}
                          onChange={(e) => setQuiz({ ...quiz, category: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40 focus:bg-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-white/70">Difficulty</label>
                        <select
                          value={quiz.difficulty}
                          onChange={(e) => setQuiz({ ...quiz, difficulty: e.target.value as CreatorQuiz["difficulty"] })}
                          className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40 focus:bg-white/10"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-white/70">Time limit (sec)</label>
                        <input
                          value={quiz.timeLimitSec}
                          onChange={(e) => setQuiz({ ...quiz, timeLimitSec: Number(e.target.value || 0) })}
                          type="number"
                          min={30}
                          max={3600}
                          className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40 focus:bg-white/10"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-white/70">Description</label>
                        <textarea
                          value={quiz.description}
                          onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                          rows={3}
                          className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40 focus:bg-white/10"
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setError(null);
                          try {
                            await creatorUpdateQuiz(quiz.id, {
                              title: quiz.title,
                              description: quiz.description,
                              category: quiz.category,
                              difficulty: quiz.difficulty,
                              timeLimitSec: quiz.timeLimitSec
                            });
                            await refreshList();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "SAVE_FAILED");
                          }
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                      >
                        <Save className="h-4 w-4" />
                        Save details
                      </button>

                      <Link
                        href="/quizzes"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                      >
                        Preview & play
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="text-sm font-extrabold text-white">Questions (JSON)</div>
                    <div className="mt-2 text-xs font-semibold text-white/55">Edit as JSON array of objects: prompt, options[], correctIndex, explanation, topic.</div>
                    <textarea
                      value={JSON.stringify(quiz.questions, null, 2)}
                      onChange={(e) => {
                        try {
                          const q = JSON.parse(e.target.value) as CreatorQuestion[];
                          setQuiz({ ...quiz, questions: q });
                        } catch {
                          // ignore parse errors while typing
                        }
                      }}
                      rows={12}
                      className="mt-4 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 font-mono text-xs text-white outline-none focus:border-cyan-300/40 focus:bg-white/10"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setError(null);
                        try {
                          await creatorSetQuestions(quiz.id, quiz.questions);
                          await refreshList();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "SAVE_QUESTIONS_FAILED");
                        }
                      }}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500/90 via-fuchsia-500/80 to-cyan-400/80 px-6 py-3 text-sm font-extrabold text-white shadow-glow transition-all duration-300 hover:scale-[1.01]"
                    >
                      <Save className="h-4 w-4" />
                      Save questions
                    </button>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="text-sm font-extrabold text-white">Import CSV</div>
                    <div className="mt-2 text-xs font-semibold text-white/55">Header: prompt, optionA, optionB, optionC, optionD, correctIndex, explanation, topic</div>
                    <textarea
                      value={csv}
                      onChange={(e) => setCsv(e.target.value)}
                      rows={6}
                      className="mt-4 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 font-mono text-xs text-white outline-none focus:border-cyan-300/40 focus:bg-white/10"
                      placeholder="prompt,optionA,optionB,optionC,optionD,correctIndex,explanation,topic"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setError(null);
                        try {
                          const res = await creatorImportCsv(quiz.id, csv);
                          const refreshed = await creatorGetQuiz(quiz.id);
                          setQuiz(refreshed.quiz);
                          setCsv("");
                          await refreshList();
                          setError(`Imported: ${res.imported}`);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "IMPORT_FAILED");
                        }
                      }}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                    >
                      <Upload className="h-4 w-4" />
                      Import CSV
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">Select a quiz to edit, or create a new one.</div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}