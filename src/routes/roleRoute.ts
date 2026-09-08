import express from "express";
import { createRole, getRoles } from "../controllers/roleHandler";

const router = express.Router();

router.post("/role",createRole)
router.get("/roles",getRoles)
export default router;