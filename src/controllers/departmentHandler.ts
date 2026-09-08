import { Department } from "../models/departmentSchema";
import { Request, Response } from "express";
import {
  sendBadRequest,
  sendCreatedResponse,
  sendInternalServerError,
  sendSuccessResponse
} from "../utils/responseHelper";

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body || {};

    if (!name || !description) {
      return sendBadRequest(res, "All fields are required");
    }


    await Department.create(req.body);
    return sendCreatedResponse(res, "Department created successfully");
  } catch (err: any) {
    return sendInternalServerError(res, "Failed to create department");
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await Department.find();
    return sendSuccessResponse(
      res,
      "Departments fetched successfully",
      departments,
    );
  } catch (err: any) {
    return sendInternalServerError(res, "Failed to fetch departments");
  }
};
