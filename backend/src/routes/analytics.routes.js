import express from "express";

import { requireAuth } from "../middleware/auth.js";
import { getMyAnalytics } from "../controllers/analytics.controller.js";

export const analyticsRouter = express.Router();

analyticsRouter.get("/me", requireAuth, getMyAnalytics);