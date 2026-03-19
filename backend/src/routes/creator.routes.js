import express from "express";

import { requireCreatorAccess } from "../middleware/creatorAccess.js";
import {
  createQuiz,
  deleteQuiz,
  getQuizForEdit,
  importQuestionsCsv,
  listCreatorQuizzes,
  setPublished,
  setQuestions,
  updateQuiz
} from "../controllers/creator.controller.js";

export const creatorRouter = express.Router();

creatorRouter.use(requireCreatorAccess);

creatorRouter.get("/quizzes", listCreatorQuizzes);
creatorRouter.post("/quizzes", createQuiz);
creatorRouter.get("/quizzes/:id", getQuizForEdit);
creatorRouter.patch("/quizzes/:id", updateQuiz);
creatorRouter.put("/quizzes/:id/questions", setQuestions);
creatorRouter.post("/quizzes/:id/import/csv", importQuestionsCsv);
creatorRouter.patch("/quizzes/:id/publish", setPublished);
creatorRouter.delete("/quizzes/:id", deleteQuiz);