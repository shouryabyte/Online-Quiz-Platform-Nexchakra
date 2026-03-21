import { User } from "../models/User.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function publicStats(user, rank) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
    xp: user.xp,
    rank,
    streak: user.streak,
    quizzesTaken: user.quizzesTaken,
    accuracy: user.accuracy,
    lastQuizAt: user.lastQuizAt
  };
}

export const getDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean({ virtuals: true });
  if (!user) return res.status(401).json({ error: "UNAUTHENTICATED" });

  const higher = await User.countDocuments({ roles: { $nin: ["admin"] }, xp: { $gt: user.xp } });
  const rank = higher + 1;

  const attempts = await QuizAttempt.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate({ path: "quizId", select: { title: 1, category: 1, difficulty: 1, timeLimitSec: 1 } })
    .lean();

  res.json({
    stats: publicStats(user, rank),
    recentAttempts: attempts.map((a) => ({
      id: String(a._id),
      createdAt: a.createdAt,
      quiz: a.quizId
        ? {
            id: String(a.quizId._id),
            title: a.quizId.title,
            category: a.quizId.category,
            difficulty: a.quizId.difficulty,
            timeLimitSec: a.quizId.timeLimitSec
          }
        : null,
      score: a.score,
      correctCount: a.correctCount,
      totalQuestions: a.totalQuestions,
      timeTakenSec: a.timeTakenSec,
      xpAwarded: a.xpAwarded
    }))
  });
});