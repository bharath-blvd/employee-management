import { Request, Response } from "express";
import { Leave } from "../models/leaveSchema";
import { Employee } from "../models/employeeSchema";
import {
  sendNotFound,
  sendForbidden,
  sendInternalServerError,
  sendSuccessResponse,
} from "../utils/responseHelper";

export const getLeavesByReportsTo = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = req.user;

    // Only manager can view leaves of direct reportees
    // if (user?.role !== "manager") {
    //   return sendForbidden(
    //     res,
    //     "Only manager can view leaves of reportees",
    //   );
    // }

    if(!user){
      return sendForbidden(res, "Unauthorized");
    }

    const employees = await Employee.find({
      reportsTo: user.employeeId,
      isDeleted: false,
    }).select("_id");

    if (employees.length === 0) {
      return sendNotFound(res, "No employees report to you");
    }

    const employeeIds = employees.map(
      (employee) => employee._id,
    );
    console.log(employeeIds)
    
    const leaves = await Leave.find({
      user: { $in: employeeIds },
    })
    .select("-createdAt -updatedAt -__v")

      // User: only required employee information
      .populate({
        path: "user",
        select: "name email designation -_id",
      })

      // Department: only department name
      .populate({
        path: "department",
        select: "name -_id",
      });

    if (leaves.length === 0) {
      return sendNotFound(
        res,
        "No leaves found for your reportees",
      );
    }

    return sendSuccessResponse(
      res,
      "Reportee leaves fetched successfully",
      leaves,
    );
  } catch (err: any) {
    if (err.name === "CastError") {
      return sendNotFound(res, "Invalid employee ID");
    }

    return sendInternalServerError(
      res,
      "Failed to fetch reportee leaves",
    );
  }
};