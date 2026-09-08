import { Role } from "../models/roleSchema";
import { Request, Response } from "express";
import {
  sendBadRequest,
  sendCreatedResponse,
  sendInternalServerError,
  sendSuccessResponse,
} from "../utils/responseHelper";

export const createRole = async(req:Request, res:Response)=>{
    try{
        const {roleName} = req.body || {}
        if(!roleName){
            return sendBadRequest(res, "role name is  required");
        }

        const existingRole = await Role.findOne({roleName})
        if(existingRole){
            return sendBadRequest(res, "role already exists");
        }
        await Role.create(req.body)
        return sendCreatedResponse(res, "role created successfully");
        

    }
    catch (err: any) {
    return sendInternalServerError(res, "Failed to create role");
  }
}

export const getRoles = async(req:Request, res:Response)=>{
    try{
        const roles = await Role.find()
        return sendSuccessResponse(
      res,
      "roles fetched successfully",
      roles,
    );

    }
    catch (err: any) {
        return sendInternalServerError(res, "Failed to fetch roles");
    }
}