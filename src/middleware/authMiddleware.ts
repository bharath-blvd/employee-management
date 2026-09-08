import { Request, Response, NextFunction } from "express";
import Jwt from "jsonwebtoken";
import { Employee } from "../models/employeeSchema";
import {
  sendUnauthorized,
} from "../utils/responseHelper";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return sendUnauthorized(res, "Token is required");
    }

    // Verify JWT 

    const decoded: any = Jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    );

    // Find employee from database
    const employee = await Employee.findOne({
      _id: decoded.employeeId,
      isDeleted: false,
    });

    if (!employee) {
      return sendUnauthorized(res, "Employee not found");
    }

    // If employee must change temporary password,allow only change-password endpoint
    // if (
    //   employee.passwordResetRequired &&
    //   req.path !== "/auth/change-password"
    // ) {
    //   return sendForbidden(
    //     res,
    //     "Please change your temporary password before accessing this resource",
    //   );
    // }

    // Store user information in request
    (req as any).user = {
      employeeId: employee._id,
      role: decoded.role,
      department: employee.department,
      reportsTo: employee.reportsTo
    };

    next();
  } catch (err) {
    return sendUnauthorized(res, "Invalid or expired token");
  }
};