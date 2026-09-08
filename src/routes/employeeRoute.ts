
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeHandler";
import { getEmployeesByReportsTo } from "../controllers/getEmployeesByReportsToHandler";

import { getEmployeesByDepartment } from "../controllers/getEmployeesByDepartmentHandler";
import { updateEmployeeRating } from "../controllers/updateEmployeeRatingHandler";
const router = express.Router();

router.post("/employees", authMiddleware, createEmployee);
router.get("/employees", authMiddleware, getEmployees);
router.get("/employees/department", authMiddleware, getEmployeesByDepartment);
router.get("/employees/reports-to", authMiddleware, getEmployeesByReportsTo)
router.get("/employees/:_id", authMiddleware, getEmployeeById);
router.put("/employees/:_id", authMiddleware, updateEmployee);
router.put("/employees/:_id/rating", authMiddleware, updateEmployeeRating);
router.delete("/employees/:_id", authMiddleware, deleteEmployee);

export default router;
