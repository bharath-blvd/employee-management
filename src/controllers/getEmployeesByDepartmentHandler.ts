import { Request, Response } from "express";
import { Employee } from "../models/employeeSchema";
import {
  sendNotFound,
  sendForbidden,
  sendInternalServerError,
  sendSuccessResponse,
} from "../utils/responseHelper";

// GET EMPLOYEES BY DEPARTMENT
export const getEmployeesByDepartment = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    // Only manager can use this operation
    if (user?.role !== "manager") {
      return sendForbidden(res, "only manager can view department employees");
    }

    const employees = await Employee.find({
      department: user.department,
      isDeleted: false,
    })
      .select("-password -createdAt -updatedAt -__v -leaveBalance._id")

      // Role: only roleName
      .populate({
        path: "role",
        select: "roleName -_id",
      })

      // ReportsTo: only name and designation
      .populate({
        path: "reportsTo",
        select: "name designation -_id",
      })

      // Department: only department name
      .populate({
        path: "department",
        select: "name -_id",
      });

    

    return sendSuccessResponse(
      res,
      "department employees fetched successfull",
      employees,
    );
  } catch (err: any) {
    if (err.name === "CastError") {
      return sendNotFound(res, "Employee ID is incorrect");
    } else {
      return sendInternalServerError(
        res,
        "Failed to fetch department employees",
      );
    }
  }
};
