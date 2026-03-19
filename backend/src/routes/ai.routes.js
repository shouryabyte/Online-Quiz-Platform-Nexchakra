import express from "express";

import { requireAuth } from "../middleware/auth.js";
import { generateQuiz } from "../controllers/ai.controller.js";

export const aiRouter = express.Router();

aiRouter.post("/generate", requireAuth, generateQuiz);