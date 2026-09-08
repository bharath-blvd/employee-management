import { Request, Response } from "express";
import { Leave } from "../models/leaveSchema";
import { Employee } from "../models/employeeSchema";
import {
  sendBadRequest,
  sendNotFound,
  sendForbidden,
  sendInternalServerError,
  sendSuccessResponse,
} from "../utils/responseHelper";

export const leaveStatusUpdate = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    

    if(!user){
      return sendForbidden(res, "Unauthorized"); 
    }

    const { status } = req.body;

    if (status !== "approved" && status !== "rejected") {
      return sendBadRequest(
        res,
        "status must be changed to approved or rejected",
      );
    }

    const existingLeave = await Leave.findById(req.params._id);

    if (!existingLeave) {
      return sendNotFound(res, "Leave not found");
    }

    // Once processed, status cannot be changed
    if (existingLeave.status !== "pending") {
      return sendBadRequest(res, "Leave has already been processed");
    }
    // Find the employee who applied for the leave
    const employee = await Employee.findOne({
      _id: existingLeave.user,
      reportsTo:user.employeeId,
      isDeleted: false,
    });

    if (!employee) {
      return sendNotFound(res, "You can update leaves only for employees who report to you");
    }

    // Only the employee's reporting manager can approve/reject
    // if (String(employee.reportsTo) !== String(user.employeeId)) {
    //   return sendForbidden(
    //     res,
    //     "You can update leaves only for employees who report to you",
    //   );
    // }


    // If leave is rejected, return the deducted leave balance
    if (status === "rejected") {
      if (existingLeave.leaveType === "annual") {
        employee.leaveBalance.annual += existingLeave.leaveDays;
      } else if (existingLeave.leaveType === "sick") {
        employee.leaveBalance.sick += existingLeave.leaveDays;
      }

      await employee.save();
    }

    // Update leave status
    const leave = await Leave.findOneAndUpdate(
      {
        _id: req.params._id,
      },
      {
        status: status,
      },
      {
        new: true,
      },
    );

    return sendSuccessResponse(
      res,
      `Leave ${status} successful`,
      leave,
    );
  } catch (err: any) {
    if (err.name === "CastError") {
      return sendBadRequest(res, "Invalid leave ID");
    }

    return sendInternalServerError(
      res,
      "Failed to update leave status",
    );
  }
};