import { Request, Response } from "express";
import { Leave } from "../models/leaveSchema";
import {
  sendBadRequest,
  sendCreatedResponse,
  sendNotFound,
  sendForbidden,
  sendInternalServerError,
  sendSuccessResponse,
} from "../utils/responseHelper";
import { calculateWorkingDays, getAvailableLeaveBalance, deductLeaveBalance } from "../services/leaveService";
import { Employee } from "../models/employeeSchema";

// POST /leaves
// Employee applies for leave
export const applyLeave = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    

    // Only employee can apply for leave
    if (user?.role !== "employee") {
      return sendForbidden(res, "Only employee can apply for leave");
    }

    const { leaveType, fromDate, toDate, reason } = req.body;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return sendBadRequest(res, "All fields are mandatory");
    }

    if (new Date(toDate) < new Date(fromDate)) {
      return sendBadRequest(res, "To date cannot be before from date");
    }

    // Find logged-in employee directly using employeeId from JWT
    const employee = await Employee.findOne({
      _id: user.employeeId,
      isDeleted: false,
    });

    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }

    

    // Calculate working days
    const workingDays = calculateWorkingDays(fromDate, toDate);

    

    let availableBalance: number;

    // if (leaveType === "annual") {
    //   availableBalance = employee.leaveBalance.annual;
    // } else if (leaveType === "sick") {
    //   availableBalance = employee.leaveBalance.sick;
    // } else {
    //   return sendBadRequest(res, "Invalid leave type");
    // }

      try {
      availableBalance = getAvailableLeaveBalance(
        employee,
        leaveType,
      );
    } catch {
      return sendBadRequest(res, "Invalid leave type");
    }

    // Check leave balance
    if (workingDays > availableBalance) {
      return sendBadRequest(res, "Insufficient leave balance");
    }

     // Deduct leave balance
    try {
      deductLeaveBalance(
        employee,
        leaveType,
        workingDays,
      );
    } catch {
      return sendBadRequest(res, "Invalid leave type");
    }

    // // Deduct leave balance
    // if (leaveType === "annual") {
    //   employee.leaveBalance.annual -= workingDays;
    // } else if (leaveType === "sick") {
    //   employee.leaveBalance.sick -= workingDays;
    // }

    

    // Create leave
    await Leave.create({
      user: user.employeeId,
      department: user.department,
      leaveType,
      fromDate,
      toDate,
      reason,
      leaveDays: workingDays,
    });

    await employee.save();


    return sendCreatedResponse(res, "Leave applied successfully", {
      leaveBalance: employee.leaveBalance,
    });
  } catch (err: any) {
    if (err.name === "CastError") {
      console.log(err);
      return sendBadRequest(res, "Apply leave error:");
    }

    return sendInternalServerError(res, "Failed to apply for leave");
  }
};

// GET /leaves
// Employee / Manager / HR can view leaves
export const getLeaves = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    const filter: any = {};

    // Employee views only own leaves
    if (user?.role === "employee") {
      filter.user = user.employeeId;
    }

    // // Manager views leaves from own department
    // else if (user?.role === "manager") {
    //   filter.department = user.department;
    // }

    // HR views all leaves
    else if (user?.role === "hr") {
      
    } else {
      return sendForbidden(res, "You are not allowed to view leaves");
    }

    // Filter by status if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const leaves = await Leave.find(filter);

    if (leaves.length === 0) {
      return sendNotFound(res, "No leaves found");
    }

    return sendSuccessResponse(res, "Leaves fetched successfully", leaves);
  } catch (err: any) {
    if (err.name === "CastError") {
      return sendBadRequest(res, "Invalid filter value");
    }

    return sendInternalServerError(res, "Failed to fetch leaves");
  }
};