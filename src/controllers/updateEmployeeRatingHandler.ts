import { Request, Response } from "express";
import { Employee } from "../models/employeeSchema";
import {
  sendBadRequest,
  sendNotFound,
  sendForbidden,
  sendInternalServerError,
  sendSuccessResponse,
} from "../utils/responseHelper";

export const updateEmployeeRating = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    // Only manager can give rating
    if (user?.role !== "manager") {
      return sendForbidden(res, "Only manager can give performance rating");
    }

    if (Object.keys(req.body).length !== 1 || !req.body.rating) {
      return sendBadRequest(res, "Only rating is allowed");
    }

    const { rating } = req.body;

    // Rating must be between 1 and 5
    if (rating < 1 || rating > 5) {
      return sendBadRequest(res, "Rating must be between 1 and 5");
    }

    // Find employee
    const employee = await Employee.findOne({
      _id: req.params._id,
      isDeleted: false,
    });

    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }

    // Manager can rate only employees in their department
    if (String(employee.department) !== String(user.department)) {
      return sendForbidden(
        res,
        "Manager can rate only employees in their department",
      );
    }

    // Update rating
    employee.rating = rating;

    await employee.save();

    return sendSuccessResponse(
      res,
      "Employee rating updated successfully",
    );
  } catch (err: any) {
    if (err.name === "CastError") {
      return sendNotFound(res, "Employee ID is incorrect");
    }

    return sendInternalServerError(res, "Invalid operation");
  }
};