import  express  from "express";

import { createDepartment, getDepartments } from "../controllers/departmentHandler";

const router=express.Router()

router.post('/department',createDepartment)
router.get("/departments", getDepartments);

export default router