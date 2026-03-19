export type Badge = { key: string; earnedAt: string };

export type PublicUser = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  provider: "local" | "google" | "github";
  roles: string[];

  xp: number;
  level: number;
  streak: number;
  quizzesTaken: number;
  accuracy: number;

  badges: Badge[];
  isPremium: boolean;
  premiumUntil: string | null;
};

export type AdminSession = {
  id: string;
  name: string;
  email: string;
};

export type CategorySummary = { name: string; quizCount: number };

export type QuizSummary = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimitSec: number;
  questionCount: number;
};

export type QuizForPlay = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimitSec: number;
  questions: { index: number; prompt: string; options: string[]; topic: string }[];
};

export type QuizResult = {
  attemptId: string;
  quizId: string;
  title: string;
  category: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenSec: number;
  xpAwarded: number;
  answers: {
    questionIndex: number;
    prompt: string;
    options: string[];
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    explanation: string;
    topic: string;
  }[];
};

export type LeaderUser = {
  id: string;
  name: string;
  avatarUrl: string;
  xp: number;
  quizzesTaken: number;
  accuracy: number;
};

export type LeaderRow = LeaderUser & { rank: number };

export type DashboardStats = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  provider: "local" | "google" | "github";
  xp: number;
  level: number;
  rank: number;
  streak: number;
  quizzesTaken: number;
  accuracy: number;
  lastQuizAt: string | null;
  badges: Badge[];
  isPremium: boolean;
  premiumUntil: string | null;
};

export type RecentAttempt = {
  id: string;
  createdAt: string;
  quiz: {
    id: string;
    title: string;
    category: string;
    difficulty: "easy" | "medium" | "hard";
    timeLimitSec: number;
  } | null;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenSec: number;
  xpAwarded: number;
};

export type TopicStat = { topic: string; total: number; correct: number; accuracy: number };

export type Analytics = {
  overview: { attempts: number; accuracy: number; avgSecPerQuestion: number };
  topicStats: TopicStat[];
};

export type CreatorQuizSummary = {
  id: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimitSec: number;
  published: boolean;
  questionCount: number;
  updatedAt: string;
};

export type CreatorQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
};

export type CreatorQuiz = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimitSec: number;
  published: boolean;
  questions: CreatorQuestion[];
};

export type GeneratedQuiz = {
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimitSec: number;
  questions: CreatorQuestion[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    credentials: "include"
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = (data && (data.error as string)) || `HTTP_${res.status}`;
    throw new Error(error);
  }
  return data as T;
}

export async function register(input: { name: string; email: string; password: string }) {
  return apiFetch<{ user: PublicUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function login(input: { email: string; password: string }) {
  return apiFetch<{ user: PublicUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function logout() {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}

export async function me() {
  return apiFetch<{ user: PublicUser }>("/api/auth/me");
}

export async function adminLogin(input: { email: string; password: string }) {
  return apiFetch<{ admin: AdminSession }>("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function adminLogout() {
  return apiFetch<void>("/api/admin/auth/logout", { method: "POST" });
}

export async function adminMe() {
  return apiFetch<{ admin: AdminSession }>("/api/admin/auth/me");
}

export async function getCategories() {
  return apiFetch<{ categories: CategorySummary[] }>("/api/quizzes/categories");
}

export async function getQuizzes(params?: { category?: string; difficulty?: string }) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.difficulty) qs.set("difficulty", params.difficulty);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{ quizzes: QuizSummary[] }>(`/api/quizzes${suffix}`);
}

export async function getQuiz(id: string) {
  return apiFetch<{ quiz: QuizForPlay }>(`/api/quizzes/${id}`);
}

export async function submitQuiz(
  id: string,
  input: {
    answers: number[];
    timeTakenSec: number;
    antiCheat?: { tabHiddenCount: number; fullscreenExitCount: number };
    events?: { type: string; ts: number; meta?: Record<string, unknown> }[];
  }
) {
  return apiFetch<{ result: QuizResult }>(`/api/quizzes/${id}/submit`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getLeaderboard(limit = 20) {
  return apiFetch<{ leaderboard: LeaderRow[] }>(`/api/leaderboard?limit=${limit}`);
}

export async function getMyRank() {
  return apiFetch<{ me: LeaderUser; rank: number }>("/api/leaderboard/me");
}

export async function getDashboard() {
  return apiFetch<{ stats: DashboardStats; recentAttempts: RecentAttempt[] }>("/api/dashboard");
}

export async function getMyAnalytics() {
  return apiFetch<Analytics>("/api/analytics/me");
}

export async function creatorListQuizzes() {
  return apiFetch<{ quizzes: CreatorQuizSummary[] }>("/api/creator/quizzes");
}

export async function creatorCreateQuiz(input: {
  title: string;
  description?: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimitSec: number;
}) {
  return apiFetch<{ quizId: string }>("/api/creator/quizzes", { method: "POST", body: JSON.stringify(input) });
}

export async function creatorGetQuiz(id: string) {
  return apiFetch<{ quiz: CreatorQuiz }>(`/api/creator/quizzes/${id}`);
}

export async function creatorUpdateQuiz(id: string, input: Partial<Omit<CreatorQuiz, "id" | "questions">>) {
  return apiFetch<{ ok: true }>(`/api/creator/quizzes/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function creatorSetQuestions(id: string, questions: CreatorQuestion[]) {
  return apiFetch<{ ok: true }>(`/api/creator/quizzes/${id}/questions`, { method: "PUT", body: JSON.stringify({ questions }) });
}

export async function creatorImportCsv(id: string, csv: string) {
  return apiFetch<{ ok: true; imported: number }>(`/api/creator/quizzes/${id}/import/csv`, { method: "POST", body: JSON.stringify({ csv }) });
}

export async function creatorSetPublished(id: string, published: boolean) {
  return apiFetch<{ ok: true }>(`/api/creator/quizzes/${id}/publish`, { method: "PATCH", body: JSON.stringify({ published }) });
}

export async function creatorDeleteQuiz(id: string) {
  return apiFetch<void>(`/api/creator/quizzes/${id}`, { method: "DELETE" });
}

export async function aiGenerateQuiz(input: { topic: string; category?: string; difficulty?: "easy" | "medium" | "hard"; questionCount?: number }) {
  return apiFetch<{ quiz: GeneratedQuiz }>("/api/ai/generate", { method: "POST", body: JSON.stringify(input) });
}

export async function createRazorpayOrder(plan: "premium_month" | "premium_year") {
  return apiFetch<{ keyId: string; order: { id: string; amount: number; currency: string }; plan: string }>("/api/payments/razorpay/order", {
    method: "POST",
    body: JSON.stringify({ plan })
  });
}

export async function verifyRazorpayPayment(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return apiFetch<{ ok: true; premiumUntil: string }>("/api/payments/razorpay/verify", { method: "POST", body: JSON.stringify(input) });
}

export function oauthUrl(provider: "google" | "github") {
  return `${API_BASE}/api/auth/${provider}`;
}
