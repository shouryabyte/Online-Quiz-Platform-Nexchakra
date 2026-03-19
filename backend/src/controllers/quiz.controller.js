import { z } from "zod";
import mongoose from "mongoose";

import { Quiz } from "../models/Quiz.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCategories = asyncHandler(async (_req, res) => {
  const rows = await Quiz.aggregate([
    { $match: { published: true } },
    { $group: { _id: "$category", quizCount: { $sum: 1 } } },
    { $sort: { quizCount: -1, _id: 1 } }
  ]);
  res.json({ categories: rows.map((r) => ({ name: r._id, quizCount: r.quizCount })) });
});

export const listQuizzes = asyncHandler(async (req, res) => {
  const querySchema = z.object({
    category: z.string().trim().min(1).max(60).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional()
  });
  const q = querySchema.parse(req.query);

  const filter = { published: true };
  if (q.category) filter.category = q.category;
  if (q.difficulty) filter.difficulty = q.difficulty;

  const quizzes = await Quiz.find(filter)
    .select({ title: 1, description: 1, category: 1, difficulty: 1, timeLimitSec: 1, questions: 1 })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    quizzes: quizzes.map((quiz) => ({
      id: String(quiz._id),
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      timeLimitSec: quiz.timeLimitSec,
      questionCount: quiz.questions?.length || 0
    }))
  });
});

export const getQuizForPlay = asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "NOT_FOUND" });

  const quiz = await Quiz.findOne({ _id: id, published: true }).lean();
  if (!quiz) return res.status(404).json({ error: "NOT_FOUND" });

  res.json({
    quiz: {
      id: String(quiz._id),
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      timeLimitSec: quiz.timeLimitSec,
      questions: (quiz.questions || []).map((q, idx) => ({
        index: idx,
        prompt: q.prompt,
        options: q.options,
        topic: q.topic || ""
      }))
    }
  });
});

function dateKeyUTC(d) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return x.toISOString().slice(0, 10);
}

function computeNewStreak({ lastQuizAt, now }) {
  if (!lastQuizAt) return 1;

  const lastKey = dateKeyUTC(lastQuizAt);
  const todayKey = dateKeyUTC(now);
  if (lastKey === todayKey) return null; // no change

  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yKey = dateKeyUTC(yesterday);
  if (lastKey === yKey) return "increment";

  return 1;
}

const submitSchema = z.object({
  answers: z.array(z.number().int().min(-1).max(10)),
  timeTakenSec: z.number().int().min(0).max(60 * 60).optional()
});

function hasBadge(user, key) {
  return Array.isArray(user.badges) && user.badges.some((b) => b.key === key);
}

function awardBadges(user, { correctCount, totalQuestions, timeTakenSec }, quizTimeLimitSec) {
  const now = new Date();
  const add = (key) => {
    if (hasBadge(user, key)) return;
    user.badges = [...(user.badges || []), { key, earnedAt: now }];
  };

  if (totalQuestions > 0 && correctCount === totalQuestions) add("perfect_score");
  if (totalQuestions > 0 && correctCount >= Math.ceil(totalQuestions * 0.8) && timeTakenSec > 0 && timeTakenSec <= Math.floor(quizTimeLimitSec * 0.5)) {
    add("speed_genius");
  }
  if ((user.quizzesTaken || 0) + 1 >= 10) add("quiz_master");
}
export const submitQuiz = asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "NOT_FOUND" });

  const { answers, timeTakenSec, antiCheat, events } = submitSchema.parse(req.body);

  const quiz = await Quiz.findOne({ _id: id, published: true });
  if (!quiz) return res.status(404).json({ error: "NOT_FOUND" });

  const totalQuestions = quiz.questions.length;
  if (answers.length !== totalQuestions) return res.status(400).json({ error: "INVALID_ANSWERS_LENGTH" });

  let correctCount = 0;
  const detailedAnswers = quiz.questions.map((q, questionIndex) => {
    const selectedIndex = answers[questionIndex] ?? -1;
    const isCorrect = selectedIndex === q.correctIndex;
    if (isCorrect) correctCount += 1;

    return {
      questionIndex,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
      topic: q.topic || ""
    };
  });

  const score = correctCount;
  const safeTimeTaken = Math.max(0, Math.min(timeTakenSec ?? 0, quiz.timeLimitSec));

  const timeBonus = Math.max(0, Math.floor((quiz.timeLimitSec - safeTimeTaken) / 10));
  const xpAwarded = Math.min(250, correctCount * 10 + timeBonus);

  const suspiciousScore = (antiCheat?.tabHiddenCount || 0) * 2 + (antiCheat?.fullscreenExitCount || 0) * 2;

  const attempt = await QuizAttempt.create({
    userId: req.user._id,
    quizId: quiz._id,
    score,
    totalQuestions,
    correctCount,
    timeTakenSec: safeTimeTaken,
    xpAwarded,
    answers: detailedAnswers,
    antiCheat: {
      tabHiddenCount: antiCheat?.tabHiddenCount || 0,
      fullscreenExitCount: antiCheat?.fullscreenExitCount || 0,
      suspiciousScore
    },
    events: events || []
  });

  const user = await User.findById(req.user._id);
  if (user) {
    const now = new Date();
    const streakUpdate = computeNewStreak({ lastQuizAt: user.lastQuizAt, now });
    if (streakUpdate === "increment") user.streak = (user.streak || 0) + 1;
    else if (typeof streakUpdate === "number") user.streak = streakUpdate;

    user.lastQuizAt = now;
    user.quizzesTaken += 1;
    user.totalCorrect += correctCount;
    user.totalAnswered += totalQuestions;
    user.xp += xpAwarded;

    awardBadges(user, { correctCount, totalQuestions, timeTakenSec: safeTimeTaken }, quiz.timeLimitSec);

    await user.save();
  }

  res.json({
    result: {
      attemptId: String(attempt._id),
      quizId: String(quiz._id),
      title: quiz.title,
      category: quiz.category,
      score,
      correctCount,
      totalQuestions,
      timeTakenSec: safeTimeTaken,
      xpAwarded,
      answers: quiz.questions.map((q, idx) => ({
        questionIndex: idx,
        prompt: q.prompt,
        options: q.options,
        selectedIndex: answers[idx] ?? -1,
        correctIndex: q.correctIndex,
        isCorrect: (answers[idx] ?? -1) === q.correctIndex,
        explanation: q.explanation || "",
        topic: q.topic || ""
      }))
    }
  });
});

export const myAttemptsForQuiz = asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "NOT_FOUND" });

  const attempts = await QuizAttempt.find({ userId: req.user._id, quizId: id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select({ score: 1, correctCount: 1, totalQuestions: 1, timeTakenSec: 1, xpAwarded: 1, createdAt: 1 })
    .lean();

  res.json({
    attempts: attempts.map((a) => ({
      id: String(a._id),
      score: a.score,
      correctCount: a.correctCount,
      totalQuestions: a.totalQuestions,
      timeTakenSec: a.timeTakenSec,
      xpAwarded: a.xpAwarded,
      createdAt: a.createdAt
    }))
  });
});
