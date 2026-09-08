import { Request, Response } from "express";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  sendBadRequest,
  sendNotFound,
  sendInternalServerError,
  sendSuccessResponse,
  sendUnauthorized,
} from "../utils/responseHelper";
import { Employee } from "../models/employeeSchema";



export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendBadRequest(res, "Email and password are required");
    }

    const employee = await Employee.findOne({
      email,
      isDeleted: false,
    }).populate("role")

    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }

    const isPasswordCorrect = await bcrypt.compare(password, employee.password);

    if (!isPasswordCorrect) {
      return sendUnauthorized(res, "Incorrect password");
    }

    const token = Jwt.sign(
      {
        employeeId: employee._id,
        role: (employee.role as any).roleName,
        department: employee.department,
        reportsTo: employee.reportsTo
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1h",
      },
    );

    if (employee.passwordResetRequired) {
      return sendSuccessResponse(
        res,
        "Login successful. Please change your temporary password.",
        {
          token,
          passwordResetRequired: true,
        },
      );
    }

    return sendSuccessResponse(res, "Login successful", {
      token,
      passwordResetRequired: false,
    });
  } catch (err) {
    return sendInternalServerError(res, "Login failed");
  }
};
