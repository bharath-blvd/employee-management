import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { Employee } from "../models/employeeSchema";
import {
  sendBadRequest,
  sendCreatedResponse,
  sendInternalServerError,
} from "../utils/responseHelper";
import { sendOnboardingEmail } from "../services/emailService";
import {generateDefaultPassword} from "../utils/passwordHelper"

export const createHR = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body || {};

    if (!name || !email) {
      return sendBadRequest(res, "Name and email are required");
    }

    // Check if HR already exists with this email
    const existingHR = await Employee.findOne({
      email,
      isDeleted: false,
    });

    if (existingHR) {
      return sendBadRequest(res, "HR already exists with this email");
    }

    // Generate temporary password
    const temporaryPassword = generateDefaultPassword()

    // Hash temporary password
    const hashedPassword = await bcrypt.hash(
      temporaryPassword,
      10,
    );

    // Create HR
    const hr = await Employee.create({
      name,
      email,
      password: hashedPassword,

      // HR must change temporary password after login
      passwordResetRequired: true,

      role: "6a9032717a2d76358b080696",
      department: "6a9021dda3b0124bf2ae1352",

      reportsTo: null,

      phone: "8100000000",
      designation: "HR Manager",
      salary: 800000,
      joiningDate: new Date(),
      status: "Active",

      leaveBalance: {
        annual: 16,
        sick: 4,
      },

      isDeleted: false,
    });

    // Send temporary password to HR email
    await sendOnboardingEmail(
      email,
      name,
      temporaryPassword,
    );

    return sendCreatedResponse(
      res,
      "HR created successfully. Temporary password has been sent to the email." );
  } catch (err: any) {
    console.log("CREATE HR ERROR:", err);

    return sendInternalServerError(
      res,
      "Failed to create HR",
    );
  }
};