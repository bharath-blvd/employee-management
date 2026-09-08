import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        employeeId: string;
        role: string;
        department: string;
      };
    }
  }
}

export {};