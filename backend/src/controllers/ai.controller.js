import { z } from "zod";

import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeFallbackQuestion(topic, i) {
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

function stripJsonFromModelText(text) {
  const s = String(text || "").trim();
  if (!s) return "";

  // Remove ```json fences
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  // Otherwise try to slice from first { to last }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) return s.slice(start, end + 1).trim();

  return s;
}

const generateSchema = z.object({
  topic: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(60).default("AI"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  questionCount: z.number().int().min(3).max(20).default(5)
});

const generatedQuizSchema = z
  .object({
    quiz: z.object({
      title: z.string().min(3).max(140),
      description: z.string().min(0).max(500),
      category: z.string().min(2).max(60),
      difficulty: z.enum(["easy", "medium", "hard"]),
      timeLimitSec: z.number().int().min(30).max(3600),
      questions: z
        .array(
          z.object({
            prompt: z.string().min(3).max(500),
            options: z.array(z.string().min(1).max(200)).min(2).max(6),
            correctIndex: z.number().int().min(0).max(10),
            explanation: z.string().min(0).max(1000),
            topic: z.string().min(0).max(80)
          })
        )
        .min(3)
        .max(20)
    })
  })
  .superRefine((data, ctx) => {
    for (let i = 0; i < data.quiz.questions.length; i++) {
      const q = data.quiz.questions[i];
      if (q.correctIndex >= q.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `questions[${i}].correctIndex out of range`,
          path: ["quiz", "questions", i, "correctIndex"]
        });
      }
    }
  });

async function generateWithGroq({ topic, category, difficulty, questionCount }) {
  if (!env.GROQ_API_KEY) throw new Error("GROQ_NOT_CONFIGURED");

  const url = `${env.GROQ_BASE_URL.replace(/\/$/, "")}/chat/completions`;

  const messages = [
    {
      role: "system",
      content:
        "You generate high-quality quizzes. Return ONLY valid JSON. No markdown, no extra text. The JSON must match the requested schema."
    },
    {
      role: "user",
      content: [
        `Generate a multiple-choice quiz as JSON for: ${topic}`,
        `Category: ${category}`,
        `Difficulty: ${difficulty}`,
        `Questions: ${questionCount}`,
        "Rules:",
        "- Each question must have 4 options.",
        "- correctIndex must be 0..3.",
        "- Provide a short explanation for the correct answer.",
        "- Use topic tags (1-3 words) per question.",
        "Output schema:",
        JSON.stringify(
          {
            quiz: {
              title: "...",
              description: "...",
              category: "...",
              difficulty: "easy|medium|hard",
              timeLimitSec: 300,
              questions: [
                {
                  prompt: "...",
                  options: ["A", "B", "C", "D"],
                  correctIndex: 0,
                  explanation: "...",
                  topic: "..."
                }
              ]
            }
          },
          null,
          2
        )
      ].join("\n")
    }
  ];

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      temperature: 0.3,
      max_tokens: env.GROQ_MAX_TOKENS,
      messages
    })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`GROQ_HTTP_${resp.status}${text ? `:${text.slice(0, 200)}` : ""}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  const jsonText = stripJsonFromModelText(content);
  if (!jsonText) throw new Error("GROQ_EMPTY_RESPONSE");

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("GROQ_INVALID_JSON");
  }

  const validated = generatedQuizSchema.parse(parsed);
  return validated.quiz;
}

export const generateQuiz = asyncHandler(async (req, res) => {
  const { topic, category, difficulty, questionCount } = generateSchema.parse(req.body);

  // Prefer Groq when configured, otherwise fall back to a deterministic demo generator.
  if (env.GROQ_API_KEY) {
    try {
      const quiz = await generateWithGroq({ topic, category, difficulty, questionCount });
      return res.json({ quiz });
    } catch {
      // fall through to fallback generator
    }
  }

  const questions = Array.from({ length: questionCount }, (_, i) => makeFallbackQuestion(topic, i));

  return res.json({
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