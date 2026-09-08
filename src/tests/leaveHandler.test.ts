import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";

import {
  applyLeave,
  getLeaves,
} from "../controllers/leaveHandler";

import { Leave } from "../models/leaveSchema";
import { Employee } from "../models/employeeSchema";

import * as leaveService from "../services/leaveService";
import * as responseHelper from "../utils/responseHelper";

describe("leaveHandler", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      user: {
        employeeId: "employee123",
        role: "employee",
        department: "department123",
      } as any,

      body: {
        leaveType: "annual",
        fromDate: "2026-09-10",
        toDate: "2026-09-12",
        reason: "Personal work",
      },

      query: {},
    };

    res = {} as Response;
  });

  afterEach(() => {
    sinon.restore();
  });

  // ============================================================
  // APPLY LEAVE
  // ============================================================

  describe("applyLeave", () => {
    // 1. Only employee can apply for leave
    it("should return forbidden if user is not an employee", async () => {
      req.user = {
        employeeId: "manager123",
        role: "manager",
        department: "department123",
      } as any;

      const sendForbiddenStub = sinon.stub(
        responseHelper,
        "sendForbidden",
      );

      await applyLeave(
        req as Request,
        res as Response,
      );

      expect(sendForbiddenStub.calledOnce).to.be.true;

      expect(
        sendForbiddenStub.calledWith(
          res,
          "Only employee can apply for leave",
        ),
      ).to.be.true;
    });

    // 2. Mandatory fields
    it("should return bad request if required fields are missing", async () => {
      req.body = {
        leaveType: "annual",
        fromDate: "2026-09-10",
      };

      const sendBadRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await applyLeave(
        req as Request,
        res as Response,
      );

      expect(sendBadRequestStub.calledOnce).to.be.true;

      expect(
        sendBadRequestStub.calledWith(
          res,
          "All fields are mandatory",
        ),
      ).to.be.true;
    });

    // 3. Invalid date range
    it("should return bad request if toDate is before fromDate", async () => {
      req.body = {
        leaveType: "annual",
        fromDate: "2026-09-15",
        toDate: "2026-09-10",
        reason: "Personal work",
      };

      const sendBadRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await applyLeave(
        req as Request,
        res as Response,
      );

      expect(sendBadRequestStub.calledOnce).to.be.true;

      expect(
        sendBadRequestStub.calledWith(
          res,
          "To date cannot be before from date",
        ),
      ).to.be.true;
    });

    // 4. Employee not found
    it("should return not found if employee does not exist", async () => {
      const employeeFindOneStub = sinon.stub(
        Employee,
        "findOne",
      ) as sinon.SinonStub;

      employeeFindOneStub.resolves(null);

      const sendNotFoundStub = sinon.stub(
        responseHelper,
        "sendNotFound",
      );

      await applyLeave(
        req as Request,
        res as Response,
      );

      expect(employeeFindOneStub.calledOnce).to.be.true;

      expect(employeeFindOneStub.args[0][0]).to.deep.equal({
        _id: "employee123",
        isDeleted: false,
      });

      expect(sendNotFoundStub.calledOnce).to.be.true;

      expect(
        sendNotFoundStub.calledWith(
          res,
          "Employee not found",
        ),
      ).to.be.true;
    });

    // 5. Invalid leave type
    it("should return bad request for invalid leave type", async () => {
      req.body.leaveType = "casual";

      const employee = {
        _id: "employee123",
        leaveBalance: {
          annual: 16,
          sick: 4,
        },
      };

      const employeeFindOneStub = sinon.stub(
        Employee,
        "findOne",
      ) as sinon.SinonStub;

      employeeFindOneStub.resolves(employee);

      sinon
        .stub(leaveService, "calculateWorkingDays")
        .returns(3);

      sinon
        .stub(leaveService, "getAvailableLeaveBalance")
        .throws(new Error("Invalid leave type"));

      const sendBadRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await applyLeave(
        req as Request,
        res as Response,
      );

      expect(sendBadRequestStub.calledOnce).to.be.true;

      expect(
        sendBadRequestStub.calledWith(
          res,
          "Invalid leave type",
        ),
      ).to.be.true;
    });

    // 6. Insufficient leave balance
    it("should return bad request if leave balance is insufficient", async () => {
      const employee = {
        _id: "employee123",
        leaveBalance: {
          annual: 2,
          sick: 4,
        },
      };

      const employeeFindOneStub = sinon.stub(
        Employee,
        "findOne",
      ) as sinon.SinonStub;

      employeeFindOneStub.resolves(employee);

      sinon
        .stub(leaveService, "calculateWorkingDays")
        .returns(5);

      sinon
        .stub(leaveService, "getAvailableLeaveBalance")
        .returns(2);

      const sendBadRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await applyLeave(
        req as Request,
        res as Response,
      );

      expect(sendBadRequestStub.calledOnce).to.be.true;

      expect(
        sendBadRequestStub.calledWith(
          res,
          "Insufficient leave balance",
        ),
      ).to.be.true;
    });

    // 7. Successful leave application
    it("should apply leave successfully", async () => {
      const employee = {
        _id: "employee123",
        leaveBalance: {
          annual: 16,
          sick: 4,
        },
        save: sinon.stub().resolves(),
      };

      const employeeFindOneStub = sinon.stub(
        Employee,
        "findOne",
      ) as sinon.SinonStub;

      employeeFindOneStub.resolves(employee);

      const calculateWorkingDaysStub = sinon
        .stub(leaveService, "calculateWorkingDays")
        .returns(3);

      const getAvailableLeaveBalanceStub = sinon
        .stub(leaveService, "getAvailableLeaveBalance")
        .returns(16);

      const deductLeaveBalanceStub = sinon.stub(
        leaveService,
        "deductLeaveBalance",
      );

      const leaveCreateStub = sinon
        .stub(Leave, "create")
        .resolves({
          _id: "leave123",
        } as any);

      const sendCreatedResponseStub = sinon.stub(
        responseHelper,
        "sendCreatedResponse",
      );

      await applyLeave(
        req as Request,
        res as Response,
      );

      // Employee lookup
      expect(employeeFindOneStub.calledOnce).to.be.true;

      expect(employeeFindOneStub.args[0][0]).to.deep.equal({
        _id: "employee123",
        isDeleted: false,
      });

      // Working days calculation
      expect(
        calculateWorkingDaysStub.calledOnce,
      ).to.be.true;

      expect(
        calculateWorkingDaysStub.calledWith(
          "2026-09-10",
          "2026-09-12",
        ),
      ).to.be.true;

      // Available balance
      expect(
        getAvailableLeaveBalanceStub.calledOnce,
      ).to.be.true;

      expect(
        getAvailableLeaveBalanceStub.calledWith(
          employee,
          "annual",
        ),
      ).to.be.true;

      // Deduct balance
      expect(
        deductLeaveBalanceStub.calledOnce,
      ).to.be.true;

      expect(
        deductLeaveBalanceStub.calledWith(
          employee,
          "annual",
          3,
        ),
      ).to.be.true;

      // Leave creation
      expect(leaveCreateStub.calledOnce).to.be.true;

      expect(leaveCreateStub.args[0][0]).to.deep.equal({
        user: "employee123",
        department: "department123",
        leaveType: "annual",
        fromDate: "2026-09-10",
        toDate: "2026-09-12",
        reason: "Personal work",
        leaveDays: 3,
      });

      // Employee save
      expect(employee.save.calledOnce).to.be.true;

      // Response
      expect(
        sendCreatedResponseStub.calledOnce,
      ).to.be.true;

      expect(
        sendCreatedResponseStub.calledWith(
          res,
          "Leave applied successfully",
          {
            leaveBalance: employee.leaveBalance,
          },
        ),
      ).to.be.true;
    });

    // 8. CastError
    it("should return bad request when a CastError occurs", async () => {
      const castError: any = {
        name: "CastError",
      };

      const employeeFindOneStub = sinon.stub(
        Employee,
        "findOne",
      ) as sinon.SinonStub;

      employeeFindOneStub.throws(castError);

      const sendBadRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await applyLeave(
        req as Request,
        res as Response,
      );

      expect(sendBadRequestStub.calledOnce).to.be.true;

      expect(
        sendBadRequestStub.calledWith(
          res,
          "Apply leave error:",
        ),
      ).to.be.true;
    });

    // 9. Internal server error
    it("should return internal server error when applying leave fails", async () => {
      const employeeFindOneStub = sinon.stub(
        Employee,
        "findOne",
      ) as sinon.SinonStub;

      employeeFindOneStub.throws(
        new Error("Database error"),
      );

      const sendInternalServerErrorStub = sinon.stub(
        responseHelper,
        "sendInternalServerError",
      );

      await applyLeave(
        req as Request,
        res as Response,
      );

      expect(
        sendInternalServerErrorStub.calledOnce,
      ).to.be.true;

      expect(
        sendInternalServerErrorStub.calledWith(
          res,
          "Failed to apply for leave",
        ),
      ).to.be.true;
    });
  });

  // ============================================================
  // GET LEAVES
  // ============================================================

  describe("getLeaves", () => {
    // 10. Employee views own leaves
    it("should return employee's own leaves", async () => {
      const leaves = [
        {
          _id: "leave123",
          user: "employee123",
          leaveType: "annual",
          status: "pending",
        },
      ];

      const leaveFindStub = sinon.stub(
        Leave,
        "find",
      ) as sinon.SinonStub;

      leaveFindStub.resolves(leaves);

      const sendSuccessStub = sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getLeaves(
        req as Request,
        res as Response,
      );

      expect(leaveFindStub.calledOnce).to.be.true;

      expect(leaveFindStub.args[0][0]).to.deep.equal({
        user: "employee123",
      });

      expect(sendSuccessStub.calledOnce).to.be.true;

      expect(
        sendSuccessStub.calledWith(
          res,
          "Leaves fetched successfully",
          leaves,
        ),
      ).to.be.true;
    });

    // 11. HR views all leaves
    it("should return all leaves for HR", async () => {
      req.user = {
        employeeId: "hr123",
        role: "hr",
        department: "hrdepartment",
      } as any;

      const leaves = [
        {
          _id: "leave123",
          user: "employee123",
        },
        {
          _id: "leave456",
          user: "employee456",
        },
      ];

      const leaveFindStub = sinon.stub(
        Leave,
        "find",
      ) as sinon.SinonStub;

      leaveFindStub.resolves(leaves);

      const sendSuccessStub = sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getLeaves(
        req as Request,
        res as Response,
      );

      expect(leaveFindStub.calledOnce).to.be.true;

      expect(leaveFindStub.args[0][0]).to.deep.equal({});

      expect(sendSuccessStub.calledOnce).to.be.true;

      expect(
        sendSuccessStub.calledWith(
          res,
          "Leaves fetched successfully",
          leaves,
        ),
      ).to.be.true;
    });

    // 12. Unauthorized role
    it("should return forbidden for unauthorized roles", async () => {
      req.user = {
        employeeId: "manager123",
        role: "manager",
        department: "department123",
      } as any;

      const sendForbiddenStub = sinon.stub(
        responseHelper,
        "sendForbidden",
      );

      await getLeaves(
        req as Request,
        res as Response,
      );

      expect(sendForbiddenStub.calledOnce).to.be.true;

      expect(
        sendForbiddenStub.calledWith(
          res,
          "You are not allowed to view leaves",
        ),
      ).to.be.true;
    });

    // 13. Filter by status
    it("should filter leaves by status when status is provided", async () => {
      req.user = {
        employeeId: "employee123",
        role: "employee",
        department: "department123",
      } as any;

      req.query = {
        status: "approved",
      };

      const leaves = [
        {
          _id: "leave123",
          user: "employee123",
          status: "approved",
        },
      ];

      const leaveFindStub = sinon.stub(
        Leave,
        "find",
      ) as sinon.SinonStub;

      leaveFindStub.resolves(leaves);

      const sendSuccessStub = sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getLeaves(
        req as Request,
        res as Response,
      );

      expect(leaveFindStub.calledOnce).to.be.true;

      expect(leaveFindStub.args[0][0]).to.deep.equal({
        user: "employee123",
        status: "approved",
      });

      expect(sendSuccessStub.calledOnce).to.be.true;
    });

    // 14. No leaves found
    it("should return not found when no leaves exist", async () => {
      const leaveFindStub = sinon.stub(
        Leave,
        "find",
      ) as sinon.SinonStub;

      leaveFindStub.resolves([]);

      const sendNotFoundStub = sinon.stub(
        responseHelper,
        "sendNotFound",
      );

      await getLeaves(
        req as Request,
        res as Response,
      );

      expect(leaveFindStub.calledOnce).to.be.true;

      expect(sendNotFoundStub.calledOnce).to.be.true;

      expect(
        sendNotFoundStub.calledWith(
          res,
          "No leaves found",
        ),
      ).to.be.true;
    });

    // 15. CastError
    it("should return bad request when a CastError occurs while fetching leaves", async () => {
      const castError: any = {
        name: "CastError",
      };

      const leaveFindStub = sinon.stub(
        Leave,
        "find",
      ) as sinon.SinonStub;

      leaveFindStub.throws(castError);

      const sendBadRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await getLeaves(
        req as Request,
        res as Response,
      );

      expect(sendBadRequestStub.calledOnce).to.be.true;

      expect(
        sendBadRequestStub.calledWith(
          res,
          "Invalid filter value",
        ),
      ).to.be.true;
    });

    // 16. Internal server error
    it("should return internal server error when fetching leaves fails", async () => {
      const leaveFindStub = sinon.stub(
        Leave,
        "find",
      ) as sinon.SinonStub;

      leaveFindStub.throws(
        new Error("Database error"),
      );

      const sendInternalServerErrorStub = sinon.stub(
        responseHelper,
        "sendInternalServerError",
      );

      await getLeaves(
        req as Request,
        res as Response,
      );

      expect(
        sendInternalServerErrorStub.calledOnce,
      ).to.be.true;

      expect(
        sendInternalServerErrorStub.calledWith(
          res,
          "Failed to fetch leaves",
        ),
      ).to.be.true;
    });
  });
});