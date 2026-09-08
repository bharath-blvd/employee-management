import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

import { Employee } from "../models/employeeSchema";
import { changePassword } from "../controllers/changePasswordHandler";
import * as responseHelper from "../utils/responseHelper";

describe("Change Password Handler", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  afterEach(() => {
    sinon.restore();
  });

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  describe("changePassword", () => {
    it("should return unauthorized when employeeId is missing", async () => {
      req = {
        user: undefined,
      };

      res = {} as Response;

      const unauthorizedStub = sinon
        .stub(responseHelper, "sendUnauthorized")
        .returns(res as Response);

      await changePassword(req as Request, res as Response);

      expect(unauthorizedStub.calledOnce).to.equal(true);

      expect(unauthorizedStub.firstCall.args[0]).to.equal(res);

      expect(unauthorizedStub.firstCall.args[1]).to.equal(
        "Unauthorized",
      );
    });

    it("should return bad request when current password is missing", async () => {
      req = {
        user: {
          employeeId: "employee123",
          role: "employee",
          department: "department123",
        } as any,
        body: {
          newPassword: "NewPassword123",
        },
      };

      res = {} as Response;

      const badRequestStub = sinon
        .stub(responseHelper, "sendBadRequest")
        .returns(res as Response);

      await changePassword(req as Request, res as Response);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[0]).to.equal(res);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "Current password and new password are required",
      );
    });

    it("should return bad request when new password is missing", async () => {
      req = {
        user: {
          employeeId: "employee123",
          role: "employee",
          department: "department123",
        } as any,
        body: {
          currentPassword: "OldPassword123",
        },
      };

      res = {} as Response;

      const badRequestStub = sinon
        .stub(responseHelper, "sendBadRequest")
        .returns(res as Response);

      await changePassword(req as Request, res as Response);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "Current password and new password are required",
      );
    });

    it("should return not found when employee does not exist", async () => {
      req = {
        user: {
          employeeId: "employee123",
          role: "employee",
          department: "department123",
        } as any,
        body: {
          currentPassword: "OldPassword123",
          newPassword: "NewPassword123",
        },
      };

      res = {} as Response;

      const findOneStub = sinon
        .stub(Employee, "findOne")
        .resolves(null);

      const notFoundStub = sinon
        .stub(responseHelper, "sendNotFound")
        .returns(res as Response);

      await changePassword(req as Request, res as Response);

      expect(findOneStub.calledOnce).to.equal(true);

      expect(findOneStub.firstCall.args[0]).to.deep.equal({
        _id: "employee123",
        isDeleted: false,
      });

      expect(notFoundStub.calledOnce).to.equal(true);

      expect(notFoundStub.firstCall.args[1]).to.equal(
        "Employee not found",
      );
    });

    it("should return unauthorized when current password is incorrect", async () => {
      req = {
        user: {
          employeeId: "employee123",
          role: "employee",
          department: "department123",
        } as any,
        body: {
          currentPassword: "WrongPassword",
          newPassword: "NewPassword123",
        },
      };

      res = {} as Response;

      const employee = {
        _id: "employee123",
        password: "hashedOldPassword",
        passwordResetRequired: true,
      };

      sinon
        .stub(Employee, "findOne")
        .resolves(employee as any);

      const compareStub = sinon
        .stub(bcrypt, "compare")
        .resolves(false);

      const unauthorizedStub = sinon
        .stub(responseHelper, "sendUnauthorized")
        .returns(res as Response);

      const hashStub = sinon.stub(bcrypt, "hash");

      await changePassword(req as Request, res as Response);

      expect(compareStub.calledOnce).to.equal(true);

      expect(compareStub.firstCall.args[0]).to.equal(
        "WrongPassword",
      );

      expect(compareStub.firstCall.args[1]).to.equal(
        "hashedOldPassword",
      );

      expect(unauthorizedStub.calledOnce).to.equal(true);

      expect(unauthorizedStub.firstCall.args[1]).to.equal(
        "Current password is incorrect",
      );

      expect(hashStub.notCalled).to.equal(true);
    });

    it("should change password successfully", async () => {
      req = {
        user: {
          employeeId: "employee123",
          role: "employee",
          department: "department123",
        } as any,
        body: {
          currentPassword: "OldPassword123",
          newPassword: "NewPassword123",
        },
      };

      res = {} as Response;

      const saveStub = sinon.stub().resolves();

      const employee = {
        _id: "employee123",
        password: "hashedOldPassword",
        passwordResetRequired: true,
        save: saveStub,
      };

      sinon
        .stub(Employee, "findOne")
        .resolves(employee as any);

      const compareStub = sinon
        .stub(bcrypt, "compare")
        .resolves(true);

      const hashStub = sinon
        .stub(bcrypt, "hash")
        .resolves("hashedNewPassword" as never);

      const successStub = sinon
        .stub(responseHelper, "sendSuccessResponse")
        .returns(res as Response);

      await changePassword(req as Request, res as Response);

      // Password comparison
      expect(compareStub.calledOnce).to.equal(true);

      expect(compareStub.firstCall.args[0]).to.equal(
        "OldPassword123",
      );

      expect(compareStub.firstCall.args[1]).to.equal(
        "hashedOldPassword",
      );

      // Password hashing
      expect(hashStub.calledOnce).to.equal(true);

      expect(hashStub.firstCall.args[0]).to.equal(
        "NewPassword123",
      );

      expect(hashStub.firstCall.args[1]).to.equal(10);

      // Employee should be updated
      expect(employee.password).to.equal(
        "hashedNewPassword",
      );

      expect(employee.passwordResetRequired).to.equal(false);

      // save() should be called
      expect(saveStub.calledOnce).to.equal(true);

      // Response
      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[0]).to.equal(res);

      expect(successStub.firstCall.args[1]).to.equal(
        "Password changed successfully",
      );
    });

    it("should return not found when Employee.findOne throws CastError", async () => {
      req = {
        user: {
          employeeId: "invalid-id",
          role: "employee",
          department: "department123",
        } as any,
        body: {
          currentPassword: "OldPassword123",
          newPassword: "NewPassword123",
        },
      };

      res = {} as Response;

      const castError = new Error("Invalid employee ID");

      (castError as any).name = "CastError";

      sinon
        .stub(Employee, "findOne")
        .rejects(castError);

      const notFoundStub = sinon
        .stub(responseHelper, "sendNotFound")
        .returns(res as Response);

      await changePassword(req as Request, res as Response);

      expect(notFoundStub.calledOnce).to.equal(true);

      expect(notFoundStub.firstCall.args[0]).to.equal(res);

      expect(notFoundStub.firstCall.args[1]).to.equal(
        "Employee not found",
      );
    });

    it("should return internal server error when an unexpected error occurs", async () => {
      req = {
        user: {
          employeeId: "employee123",
          role: "employee",
          department: "department123",
        } as any,
        body: {
          currentPassword: "OldPassword123",
          newPassword: "NewPassword123",
        },
      };

      res = {} as Response;

      sinon
        .stub(Employee, "findOne")
        .rejects(new Error("Database error"));

      const internalServerErrorStub = sinon
        .stub(responseHelper, "sendInternalServerError")
        .returns(res as Response);

      await changePassword(req as Request, res as Response);

      expect(internalServerErrorStub.calledOnce).to.equal(true);

      expect(internalServerErrorStub.firstCall.args[0]).to.equal(res);

      expect(internalServerErrorStub.firstCall.args[1]).to.equal(
        "Failed to change password",
      );
    });

    it("should return internal server error when saving the new password fails", async () => {
      req = {
        user: {
          employeeId: "employee123",
          role: "employee",
          department: "department123",
        } as any,
        body: {
          currentPassword: "OldPassword123",
          newPassword: "NewPassword123",
        },
      };

      res = {} as Response;

      const saveStub = sinon
        .stub()
        .rejects(new Error("Save failed"));

      const employee = {
        _id: "employee123",
        password: "hashedOldPassword",
        passwordResetRequired: true,
        save: saveStub,
      };

      sinon
        .stub(Employee, "findOne")
        .resolves(employee as any);

      sinon
        .stub(bcrypt, "compare")
        .resolves(true);

      sinon
        .stub(bcrypt, "hash")
        .resolves("hashedNewPassword" as never);

      const internalServerErrorStub = sinon
        .stub(responseHelper, "sendInternalServerError")
        .returns(res as Response);

      await changePassword(req as Request, res as Response);

      expect(saveStub.calledOnce).to.equal(true);

      expect(internalServerErrorStub.calledOnce).to.equal(true);

      expect(internalServerErrorStub.firstCall.args[1]).to.equal(
        "Failed to change password",
      );
    });
  });
});