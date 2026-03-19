import { QuizAttempt } from "../models/QuizAttempt.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMyAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const topicRows = await QuizAttempt.aggregate([
    { $match: { userId } },
    { $unwind: "$answers" },
    {
      $group: {
        _id: { $ifNull: ["$answers.topic", ""] },
        total: { $sum: 1 },
        correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } }
      }
    },
    { $addFields: { topic: "$_id", accuracy: { $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 0] } } },
    { $project: { _id: 0, topic: 1, total: 1, correct: 1, accuracy: 1 } },
    { $sort: { accuracy: 1, total: -1, topic: 1 } }
  ]);

  const filtered = topicRows.filter((r) => (r.topic || "").trim().length > 0);

  const overall = await QuizAttempt.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        attempts: { $sum: 1 },
        totalQuestions: { $sum: "$totalQuestions" },
        correctCount: { $sum: "$correctCount" },
        totalTime: { $sum: "$timeTakenSec" }
      }
    }
  ]);

  const o = overall[0] || { attempts: 0, totalQuestions: 0, correctCount: 0, totalTime: 0 };
  const accuracy = o.totalQuestions ? Math.round((o.correctCount / o.totalQuestions) * 100) : 0;
  const avgSecPerQuestion = o.totalQuestions ? Math.round(o.totalTime / o.totalQuestions) : 0;

  res.json({
    overview: {
      attempts: o.attempts,
      accuracy,
      avgSecPerQuestion
    },
    topicStats: filtered
  });
});