import { z } from "zod";
import mongoose from "mongoose";

import { Quiz } from "../models/Quiz.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const quizCreateSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(400).optional().default(""),
  category: z.string().trim().min(2).max(60),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  timeLimitSec: z.coerce.number().int().min(30).max(3600).default(300)
});

const questionSchema = z.object({
  prompt: z.string().trim().min(3).max(500),
  options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
  correctIndex: z.number().int().min(0).max(10),
  explanation: z.string().trim().max(800).optional().default(""),
  topic: z.string().trim().max(80).optional().default("")
});

export const listCreatorQuizzes = asyncHandler(async (_req, res) => {
  const quizzes = await Quiz.find({})
    .sort({ updatedAt: -1 })
    .select({ title: 1, category: 1, difficulty: 1, timeLimitSec: 1, published: 1, updatedAt: 1, questions: 1 })
    .lean();

  res.json({
    quizzes: quizzes.map((q) => ({
      id: String(q._id),
      title: q.title,
      category: q.category,
      difficulty: q.difficulty,
      timeLimitSec: q.timeLimitSec,
      published: q.published,
      questionCount: q.questions?.length || 0,
      updatedAt: q.updatedAt
    }))
  });
});

export const createQuiz = asyncHandler(async (req, res) => {
  const data = quizCreateSchema.parse(req.body);
  const quiz = await Quiz.create({ ...data, questions: [], published: false });
  res.status(201).json({ quizId: String(quiz._id) });
});

export const getQuizForEdit = asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "NOT_FOUND" });

  const quiz = await Quiz.findById(id).lean();
  if (!quiz) return res.status(404).json({ error: "NOT_FOUND" });

  res.json({
    quiz: {
      id: String(quiz._id),
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      timeLimitSec: quiz.timeLimitSec,
      published: quiz.published,
      questions: quiz.questions
    }
  });
});

export const updateQuiz = asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "NOT_FOUND" });

  const data = quizCreateSchema.partial().parse(req.body);

  const quiz = await Quiz.findByIdAndUpdate(id, { $set: data }, { new: true });
  if (!quiz) return res.status(404).json({ error: "NOT_FOUND" });

  res.json({ ok: true });
});

export const setQuestions = asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "NOT_FOUND" });

  const payload = z.object({ questions: z.array(questionSchema).min(1).max(200) }).parse(req.body);

  const quiz = await Quiz.findByIdAndUpdate(id, { $set: { questions: payload.questions } }, { new: true });
  if (!quiz) return res.status(404).json({ error: "NOT_FOUND" });

  res.json({ ok: true });
});

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Expected header:
  // prompt,optionA,optionB,optionC,optionD,correctIndex,explanation,topic
  const rows = lines.map((line) => {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  });

  const [header, ...data] = rows;
  if (!header || header.length < 6) throw new Error("CSV header missing or invalid");

  const idx = (name) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const iPrompt = idx("prompt");
  const iA = idx("optionA");
  const iB = idx("optionB");
  const iC = idx("optionC");
  const iD = idx("optionD");
  const iCorrect = idx("correctIndex");
  const iExplanation = idx("explanation");
  const iTopic = idx("topic");

  if ([iPrompt, iA, iB, iCorrect].some((v) => v < 0)) throw new Error("CSV must include prompt, optionA, optionB, correctIndex");

  return data.map((r) => {
    const options = [r[iA], r[iB], iC >= 0 ? r[iC] : "", iD >= 0 ? r[iD] : ""].filter(Boolean);
    return {
      prompt: r[iPrompt] || "",
      options,
      correctIndex: Number(r[iCorrect] || 0),
      explanation: iExplanation >= 0 ? r[iExplanation] || "" : "",
      topic: iTopic >= 0 ? r[iTopic] || "" : ""
    };
  });
}

export const importQuestionsCsv = asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "NOT_FOUND" });

  const { csv } = z.object({ csv: z.string().min(10) }).parse(req.body);

  const questions = parseCsv(csv).map((q) => questionSchema.parse({
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    topic: q.topic
  }));

  const quiz = await Quiz.findByIdAndUpdate(id, { $set: { questions } }, { new: true });
  if (!quiz) return res.status(404).json({ error: "NOT_FOUND" });

  res.json({ ok: true, imported: questions.length });
});

export const setPublished = asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "NOT_FOUND" });

  const { published } = z.object({ published: z.boolean() }).parse(req.body);

  const quiz = await Quiz.findByIdAndUpdate(id, { $set: { published } }, { new: true });
  if (!quiz) return res.status(404).json({ error: "NOT_FOUND" });

  res.json({ ok: true });
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "NOT_FOUND" });

  await Quiz.deleteOne({ _id: id });
  res.status(204).end();
});