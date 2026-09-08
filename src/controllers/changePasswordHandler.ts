import { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  sendBadRequest,
  sendNotFound,
  sendInternalServerError,
  sendSuccessResponse,
  sendUnauthorized,
} from "../utils/responseHelper";
import { Employee } from "../models/employeeSchema";


export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.employeeId) {
      return sendUnauthorized(res, "Unauthorized");
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendBadRequest(
        res,
        "Current password and new password are required",
      );
    }

    const employee = await Employee.findOne({
      _id: user.employeeId,
      isDeleted: false,
    });

    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      employee.password,
    );

    if (!isPasswordCorrect) {
      return sendUnauthorized(res, "Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    employee.password = hashedPassword;
    employee.passwordResetRequired = false;

    await employee.save();

    return sendSuccessResponse(res, "Password changed successfully");
  } catch (err: any) {
    console.log("CHANGE PASSWORD ERROR:", err); 

    if (err.name === "CastError") {
      return sendNotFound(res, "Employee not found");
    }

    return sendInternalServerError(res, "Failed to change password");
  }
};