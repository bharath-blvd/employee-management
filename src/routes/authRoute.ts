import express from "express";
import {login} from "../controllers/authHandler";
import { changePassword } from "../controllers/changePasswordHandler";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router()
router.post("/auth/login", login)
router.post("/auth/change-password", authMiddleware, changePassword)

export default router