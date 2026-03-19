import { Router } from "express";
import { adminLogin, adminLogout, adminMe } from "../controllers/adminAuth.controller.js";
import { requireAdmin } from "../middleware/adminAuth.js";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", adminLogin);
adminAuthRouter.get("/me", requireAdmin, adminMe);
adminAuthRouter.post("/logout", adminLogout);