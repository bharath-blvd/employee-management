import { Request, Response } from "express";
import { Employee } from "../models/employeeSchema";
import {
  sendNotFound,
  sendForbidden,
  sendInternalServerError,
  sendSuccessResponse,
} from "../utils/responseHelper";

export const getEmployeesByReportsTo = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = req.user;


    // User must be authenticated
    if (!user) {
      return sendForbidden(res, "Unauthorized");
    }

    // Find employees who directly report to 
    const employees = await Employee.find({
      reportsTo: user.employeeId,
      isDeleted: false,
    })
      .select("-password -createdAt -updatedAt -__v -leaveBalance._id")

      // Employee's role: only roleName
      .populate({
        path: "role",
        select: "roleName -_id",
      })

      // Employee's department: only department name
      .populate({
        path: "department",
        select: "name -_id",
      })

      // Employee's reportsTo: only name and designation
      .populate({
        path: "reportsTo",
        select: "name designation -_id",
      }); 

    if (employees.length === 0) {
      return sendNotFound(
        res,
        "No employees found reporting to you",
      );
    }

    return sendSuccessResponse(
      res,
      "Reporting employees fetched successfully",
      employees,
    );
  } catch (err: any) {
    if (err.name === "CastError") {
      return sendNotFound(res, "Invalid employee ID");
    }

    return sendInternalServerError(
      res,
      "Failed to fetch reporting employees",
    );
  }
};