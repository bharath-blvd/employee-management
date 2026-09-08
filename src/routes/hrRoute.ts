import { Router } from "express";
import { createHR } from "../controllers/createHRHandler";

const router = Router();

router.post("/create-hr", createHR);

export default router;