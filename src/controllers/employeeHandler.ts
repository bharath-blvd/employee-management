import { Request, Response } from "express";
import { Employee } from "../models/employeeSchema";
import {
  sendBadRequest,
  sendCreatedResponse,
  sendNotFound,
  sendForbidden,
  sendInternalServerError,
  sendSuccessResponse,
} from "../utils/responseHelper";
import { isValidEmail, isValidPhone } from "../utils/validationHelper";
import bcrypt from "bcrypt";
import { generateDefaultPassword } from "../utils/passwordHelper";
import { sendOnboardingEmail } from "../services/emailService";

// CREATE EMPLOYEE
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      department,
      designation,
      salary,
      joiningDate,
      role,
      reportsTo,
    } = req.body || {};

    const user = req.user;

    // only hr can create employees
    if (user?.role !== "hr") {
      return sendForbidden(res, "Only HR is allowed to create employees");
    }

    if (
      !name ||
      !email ||
      !phone ||
      !department ||
      !designation ||
      !salary ||
      !joiningDate ||
      !role
    ) {
      return sendBadRequest(res, "All fields are required");
    }

    if (!isValidEmail(email)) {
      return sendBadRequest(res, "Invalid email format");
    }

    if (!isValidPhone(phone)) {
      return sendBadRequest(res, "Invalid phone number");
    }

    const existingEmail = await Employee.findOne({ email });

    if (existingEmail) {
      return sendBadRequest(res, "email already exists");
    }

    // generate default password
    const defaultPassword = generateDefaultPassword();

    // hash default password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const employee = await Employee.create({
      name,
      email,
      phone,
      department,
      designation,
      salary,
      joiningDate,
      role,
      reportsTo,
      password: hashedPassword,
      passwordResetRequired: true,
    });
    await sendOnboardingEmail(email, name, defaultPassword);

    return sendCreatedResponse(res, "Employee created successfully. Login credentials have been sent to the employee's email.")
  } catch (err: any) {
    console.log("CREATE EMPLOYEE ERROR:", err);
    return sendInternalServerError(res, "Failed to create employee");
  }
};

// GET ALL EMPLOYEES
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    // only hr and admin can get all employees
    if (user?.role !== "hr" && user?.role !== "admin") {
      return sendForbidden(res, "Only HR and Admin can view all details");
    }

    const { search, department, status, sort } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // filter
    const filter: any = {
      isDeleted: false,
    };

    if (department) {
      filter.department = department;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          designation: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const employees = await Employee.find(filter)
      .select("-password -createdAt -updatedAt -__v -leaveBalance._id")

      // Employee's role: only roleName
      .populate({
        path: "role",
        select: "roleName -_id",
      })

      // Employee's department: only name
      .populate({
        path: "department",
        select: "name -_id",
      })

      // Employee's reportsTo: only name and designation
      .populate({
        path: "reportsTo",
        select: "name designation -_id",
      })
      .sort(sort ? String(sort) : "name")
      .skip(skip)
      .limit(limit);

    return sendSuccessResponse(
      res,
      "Employees fetched successfully",
      employees,
    );
  } catch (err: any) {
    if (err.name === "CastError") {
      return sendNotFound(res, "Invalid filter value");
    } else {
      return sendInternalServerError(res, "Failed to fetch employees");
    }
  }
};

// GET EMPLOYEE BY ID
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    const employee = await Employee.findOne({
      _id: req.params._id,
      isDeleted: false,
    })
      .select("-password -createdAt -updatedAt -__v -leaveBalance._id")
      .populate({
        path: "role",
        select: "roleName -_id",
      })
      .populate({
        path: "department",
        select: "_id name",
      })
      .populate({
        path: "reportsTo",
        select: "name designation -_id",
      });

    if (!employee) {
      return sendNotFound(res, "Employee ID is incorrect");
    }

    // Employee can view only their own details
    if (
      user?.role === "employee" &&
      String(employee._id) !== String(user.employeeId)
    ) {
      return sendForbidden(res, "You can view only your details");
    }

    // Manager can view only employees in their department
    if (
      user?.role === "manager" &&
      String((employee.department as any)._id) !== String(user.department)
    ) {
      return sendForbidden(
        res,
        "You can view only employees in your department",
      );
    }
    

    return sendSuccessResponse(
      res,
      "Employee details fetched successfully",
      employee,
    );
  } catch (err: any) {
    if (err.name === "CastError") {
      return sendNotFound(res, "Employee ID is incorrect");
    }

    return sendInternalServerError(res, "Failed to fetch employee");
  }
};

// UPDATE EMPLOYEE
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (user?.role !== "hr") {
      return sendForbidden(
        res,
        "Only HR is allowed to update employee details",
      );
    }

    if (!req.params._id) {
      return sendBadRequest(res, "Employee ID is required");
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params._id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!employee) {
      return sendNotFound(res, "Employee ID not found");
    }

    return sendSuccessResponse(res, "Employee updated successfully");
  } catch (err: any) {
    if (err.name === "CastError") {
      return sendNotFound(res, "Employee ID is incorrect");
    } else {
      return sendInternalServerError(res, "Failed to update employee");
    }
  }
};

// DELETE EMPLOYEE
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (user?.role !== "hr") {
      return sendForbidden(res, "You are not allowed to delete employees");
    }

    if (!req.params._id) {
      return sendBadRequest(res, "Employee ID is required");
    }

    const employee = await Employee.findByIdAndUpdate(req.params._id, {
      isDeleted: true,
    });

    if (!employee) {
      return sendBadRequest(res, "Employee not found");
    }

    return sendSuccessResponse(res, "Employee deletion successful");
  } catch (err: any) {
    if (err.name === "CastError") {
      return sendNotFound(res, "Employee ID is incorrect");
    } else {
      return sendInternalServerError(res, "Failed to delete employee");
    }
  }
};
