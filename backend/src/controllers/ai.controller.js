import { z } from "zod";

import { asyncHandler } from "../utils/asyncHandler.js";

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeQuestion(topic, i) {
  const t = topic.trim();
  const templates = [
    {
      prompt: `Which statement best describes ${t}?`,
      options: [`A definition of ${t}`, `A runtime error in ${t}`, `A database in ${t}`, `A UI component in ${t}`],
      correctIndex: 0,
      explanation: `${t} is a concept/topic; the best answer is the definition.`,
      topic: t
    },
    {
      prompt: `Which option is most closely related to ${t}?`,
      options: [`Core concept`, `Unrelated term`, `Random fact`, `Typo`],
      correctIndex: 0,
      explanation: `The correct choice is the one that indicates a core concept related to ${t}.`,
      topic: t
    }
  ];

  const q = pick(templates);
  return { ...q, prompt: `${q.prompt} (Q${i + 1})` };
}

const generateSchema = z.object({
  topic: z.string().trim().min(2).max(60),
  category: z.string().trim().min(2).max(60).default("AI"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  questionCount: z.number().int().min(3).max(20).default(5)
});

export const generateQuiz = asyncHandler(async (req, res) => {
  const { topic, category, difficulty, questionCount } = generateSchema.parse(req.body);

  const questions = Array.from({ length: questionCount }, (_, i) => makeQuestion(topic, i));

  res.json({
    quiz: {
      title: `${topic} Quick Quiz`,
      description: `Auto-generated quiz for topic: ${topic}`,
      category,
      difficulty,
      timeLimitSec: Math.min(900, questionCount * 60),
      questions
    }
  });
});