import mongoose from "mongoose";

const attemptAnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true, min: 0 },
    selectedIndex: { type: Number, required: true, min: -1 },
    correctIndex: { type: Number, required: true, min: 0 },
    isCorrect: { type: Boolean, required: true },
    topic: { type: String, default: "", trim: true, maxlength: 80 }
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true, maxlength: 40 },
    ts: { type: Number, required: true },
    meta: { type: Object, default: {} }
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },

    score: { type: Number, default: 0, min: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    correctCount: { type: Number, default: 0, min: 0 },
    timeTakenSec: { type: Number, default: 0, min: 0 },

    xpAwarded: { type: Number, default: 0, min: 0 },
    answers: { type: [attemptAnswerSchema], default: [] },

    antiCheat: {
      tabHiddenCount: { type: Number, default: 0, min: 0 },
      fullscreenExitCount: { type: Number, default: 0, min: 0 },
      suspiciousScore: { type: Number, default: 0, min: 0 }
    },
    events: { type: [eventSchema], default: [] }
  },
  { timestamps: true }
);

quizAttemptSchema.index({ userId: 1, createdAt: -1 });
quizAttemptSchema.index({ quizId: 1, score: -1, timeTakenSec: 1 });

export const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);