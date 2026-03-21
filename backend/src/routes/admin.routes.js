import express from "express";

import { requireAdmin } from "../middleware/adminAuth.js";
import { deleteUser } from "../controllers/admin.controller.js";

export const adminRouter = express.Router();

adminRouter.use(requireAdmin);

adminRouter.delete("/users/:id", deleteUser);