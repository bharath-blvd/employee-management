
import express from "express";

import { applyLeave, getLeaves } from "../controllers/leaveHandler";
import { leaveStatusUpdate } from "../controllers/leaveStatusUpdateHandler";
import { getLeavesByReportsTo } from "../controllers/getLeavesByReportsToHandler";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/leaves", authMiddleware, applyLeave);
router.get("/leaves", authMiddleware, getLeaves);
router.get("/leaves/reports-to", authMiddleware, getLeavesByReportsTo)
router.put("/leaves/:_id/status", authMiddleware, leaveStatusUpdate);

export default router;
