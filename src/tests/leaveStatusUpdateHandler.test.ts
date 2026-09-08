import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";

import { leaveStatusUpdate } from "../controllers/leaveStatusUpdateHandler";
import { Leave } from "../models/leaveSchema";
import { Employee } from "../models/employeeSchema";

import * as responseHelper from "../utils/responseHelper";

describe("leaveStatusUpdate", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      user: {
        employeeId: "manager123",
        role: "manager",
        department: "department123",
      } as any,

      params: {
        _id: "leave123",
      },

      body: {
        status: "approved",
      },
    };

    res = {} as Response;
  });

  afterEach(() => {
    sinon.restore();
  });

  // Unauthorized user
  it("should return forbidden if user is not authenticated", async () => {
    req.user = undefined;

    const sendForbiddenStub = sinon.stub(
      responseHelper,
      "sendForbidden",
    );

    await leaveStatusUpdate(
      req as Request,
      res as Response,
    );

    expect(sendForbiddenStub.calledOnce).to.be.true;

    expect(
      sendForbiddenStub.calledWith(
        res,
        "Unauthorized",
      ),
    ).to.be.true;
  });

  // Invalid status
  it("should return bad request for invalid status", async () => {
    req.body = {
      status: "pending",
    };

    const sendBadRequestStub = sinon.stub(
      responseHelper,
      "sendBadRequest",
    );

    await leaveStatusUpdate(
      req as Request,
      res as Response,
    );

    expect(sendBadRequestStub.calledOnce).to.be.true;

    expect(
      sendBadRequestStub.calledWith(
        res,
        "status must be changed to approved or rejected",
      ),
    ).to.be.true;
  });

  // Leave not found
  it("should return not found if leave does not exist", async () => {
    const findByIdStub = sinon.stub(
      Leave,
      "findById",
    ) as sinon.SinonStub;

    findByIdStub.resolves(null);

    const sendNotFoundStub = sinon.stub(
      responseHelper,
      "sendNotFound",
    );

    await leaveStatusUpdate(
      req as Request,
      res as Response,
    );

    expect(findByIdStub.calledOnce).to.be.true;

    expect(
      findByIdStub.args[0][0],
    ).to.equal("leave123");

    expect(sendNotFoundStub.calledOnce).to.be.true;

    expect(
      sendNotFoundStub.calledWith(
        res,
        "Leave not found",
      ),
    ).to.be.true;
  });

  // Leave is already processed
  it("should return bad request if leave has already been processed", async () => {
    const existingLeave = {
      _id: "leave123",
      user: "employee123",
      status: "approved",
      leaveType: "annual",
      leaveDays: 2,
    };

    const findByIdStub = sinon.stub(
      Leave,
      "findById",
    ) as sinon.SinonStub;

    findByIdStub.resolves(existingLeave);

    const sendBadRequestStub = sinon.stub(
      responseHelper,
      "sendBadRequest",
    );

    await leaveStatusUpdate(
      req as Request,
      res as Response,
    );

    expect(findByIdStub.calledOnce).to.be.true;

    expect(sendBadRequestStub.calledOnce).to.be.true;

    expect(
      sendBadRequestStub.calledWith(
        res,
        "Leave has already been processed",
      ),
    ).to.be.true;
  });

  // Employee does not report to the manager
  it("should return not found if employee does not report to the manager", async () => {
    const existingLeave = {
      _id: "leave123",
      user: "employee123",
      status: "pending",
      leaveType: "annual",
      leaveDays: 2,
    };

    const findByIdStub = sinon.stub(
      Leave,
      "findById",
    ) as sinon.SinonStub;

    findByIdStub.resolves(existingLeave);

    const employeeFindOneStub = sinon.stub(
      Employee,
      "findOne",
    ) as sinon.SinonStub;

    employeeFindOneStub.resolves(null);

    const sendNotFoundStub = sinon.stub(
      responseHelper,
      "sendNotFound",
    );

    await leaveStatusUpdate(
      req as Request,
      res as Response,
    );

    expect(employeeFindOneStub.calledOnce).to.be.true;

    expect(
      employeeFindOneStub.args[0][0],
    ).to.deep.equal({
      _id: "employee123",
      reportsTo: "manager123",
      isDeleted: false,
    });

    expect(sendNotFoundStub.calledOnce).to.be.true;

    expect(
      sendNotFoundStub.calledWith(
        res,
        "You can update leaves only for employees who report to you",
      ),
    ).to.be.true;
  });

  // Approve leave
  it("should approve a pending leave successfully", async () => {
    req.body = {
      status: "approved",
    };

    const existingLeave = {
      _id: "leave123",
      user: "employee123",
      status: "pending",
      leaveType: "annual",
      leaveDays: 2,
    };

    const employee = {
      _id: "employee123",
      reportsTo: "manager123",

      leaveBalance: {
        annual: 14,
        sick: 4,
      },

      save: sinon.stub().resolves(),
    };

    const updatedLeave = {
      _id: "leave123",
      user: "employee123",
      status: "approved",
      leaveType: "annual",
      leaveDays: 2,
    };

    const findByIdStub = sinon.stub(
      Leave,
      "findById",
    ) as sinon.SinonStub;

    findByIdStub.resolves(existingLeave);

    const employeeFindOneStub = sinon.stub(
      Employee,
      "findOne",
    ) as sinon.SinonStub;

    employeeFindOneStub.resolves(employee);

    const findOneAndUpdateStub = sinon.stub(
      Leave,
      "findOneAndUpdate",
    ) as sinon.SinonStub;

    findOneAndUpdateStub.resolves(updatedLeave);

    const sendSuccessResponseStub = sinon.stub(
      responseHelper,
      "sendSuccessResponse",
    );

    await leaveStatusUpdate(
      req as Request,
      res as Response,
    );

    expect(findByIdStub.calledOnce).to.be.true;

    expect(
      findByIdStub.args[0][0],
    ).to.equal("leave123");

    expect(employeeFindOneStub.calledOnce).to.be.true;

    expect(
      employeeFindOneStub.args[0][0],
    ).to.deep.equal({
      _id: "employee123",
      reportsTo: "manager123",
      isDeleted: false,
    });

    // Balance should not change when leave is approved
    expect(employee.save.called).to.be.false;

    expect(findOneAndUpdateStub.calledOnce).to.be.true;

    expect(
      findOneAndUpdateStub.args[0][0],
    ).to.deep.equal({
      _id: "leave123",
    });

    expect(
      findOneAndUpdateStub.args[0][1],
    ).to.deep.equal({
      status: "approved",
    });

    expect(
      findOneAndUpdateStub.args[0][2],
    ).to.deep.equal({
      new: true,
    });

    expect(
      sendSuccessResponseStub.calledOnce,
    ).to.be.true;

    expect(
      sendSuccessResponseStub.calledWith(
        res,
        "Leave approved successful",
        updatedLeave,
      ),
    ).to.be.true;
  });

  // Reject annual leave
  it("should restore annual leave balance when leave is rejected", async () => {
    req.body = {
      status: "rejected",
    };

    const existingLeave = {
      _id: "leave123",
      user: "employee123",
      status: "pending",
      leaveType: "annual",
      leaveDays: 3,
    };

    const employee = {
      _id: "employee123",
      reportsTo: "manager123",

      leaveBalance: {
        annual: 13,
        sick: 4,
      },

      save: sinon.stub().resolves(),
    };

    const updatedLeave = {
      _id: "leave123",
      user: "employee123",
      status: "rejected",
      leaveType: "annual",
      leaveDays: 3,
    };

    const findByIdStub = sinon.stub(
      Leave,
      "findById",
    ) as sinon.SinonStub;

    findByIdStub.resolves(existingLeave);

    const employeeFindOneStub = sinon.stub(
      Employee,
      "findOne",
    ) as sinon.SinonStub;

    employeeFindOneStub.resolves(employee);

    const findOneAndUpdateStub = sinon.stub(
      Leave,
      "findOneAndUpdate",
    ) as sinon.SinonStub;

    findOneAndUpdateStub.resolves(updatedLeave);

    const sendSuccessResponseStub = sinon.stub(
      responseHelper,
      "sendSuccessResponse",
    );

    await leaveStatusUpdate(
      req as Request,
      res as Response,
    );

    expect(employee.leaveBalance.annual).to.equal(16);

    expect(employee.leaveBalance.sick).to.equal(4);

    expect(employee.save.calledOnce).to.be.true;

    expect(findOneAndUpdateStub.calledOnce).to.be.true;

    expect(
      findOneAndUpdateStub.args[0][0],
    ).to.deep.equal({
      _id: "leave123",
    });

    expect(
      findOneAndUpdateStub.args[0][1],
    ).to.deep.equal({
      status: "rejected",
    });

    expect(
      findOneAndUpdateStub.args[0][2],
    ).to.deep.equal({
      new: true,
    });

    expect(
      sendSuccessResponseStub.calledOnce,
    ).to.be.true;

    expect(
      sendSuccessResponseStub.calledWith(
        res,
        "Leave rejected successful",
        updatedLeave,
      ),
    ).to.be.true;
  });

  // Reject sick leave
  it("should restore sick leave balance when sick leave is rejected", async () => {
    req.body = {
      status: "rejected",
    };

    const existingLeave = {
      _id: "leave123",
      user: "employee123",
      status: "pending",
      leaveType: "sick",
      leaveDays: 2,
    };

    const employee = {
      _id: "employee123",
      reportsTo: "manager123",

      leaveBalance: {
        annual: 10,
        sick: 2,
      },

      save: sinon.stub().resolves(),
    };

    const updatedLeave = {
      _id: "leave123",
      user: "employee123",
      status: "rejected",
      leaveType: "sick",
      leaveDays: 2,
    };

    const findByIdStub = sinon.stub(
      Leave,
      "findById",
    ) as sinon.SinonStub;

    findByIdStub.resolves(existingLeave);

    const employeeFindOneStub = sinon.stub(
      Employee,
      "findOne",
    ) as sinon.SinonStub;

    employeeFindOneStub.resolves(employee);

    const findOneAndUpdateStub = sinon.stub(
      Leave,
      "findOneAndUpdate",
    ) as sinon.SinonStub;

    findOneAndUpdateStub.resolves(updatedLeave);

    const sendSuccessResponseStub = sinon.stub(
      responseHelper,
      "sendSuccessResponse",
    );

    await leaveStatusUpdate(
      req as Request,
      res as Response,
    );

    expect(employee.leaveBalance.sick).to.equal(4);

    expect(employee.leaveBalance.annual).to.equal(10);

    expect(employee.save.calledOnce).to.be.true;

    expect(findOneAndUpdateStub.calledOnce).to.be.true;

    expect(
      findOneAndUpdateStub.args[0][0],
    ).to.deep.equal({
      _id: "leave123",
    });

    expect(
      findOneAndUpdateStub.args[0][1],
    ).to.deep.equal({
      status: "rejected",
    });

    expect(
      findOneAndUpdateStub.args[0][2],
    ).to.deep.equal({
      new: true,
    });

    expect(
      sendSuccessResponseStub.calledOnce,
    ).to.be.true;

    expect(
      sendSuccessResponseStub.calledWith(
        res,
        "Leave rejected successful",
        updatedLeave,
      ),
    ).to.be.true;
  });

  // Invalid leave ID
  it("should return bad request for invalid leave ID", async () => {
    const castError: any = {
      name: "CastError",
    };

    const findByIdStub = sinon.stub(
      Leave,
      "findById",
    ) as sinon.SinonStub;

    findByIdStub.throws(castError);

    const sendBadRequestStub = sinon.stub(
      responseHelper,
      "sendBadRequest",
    );

    await leaveStatusUpdate(
      req as Request,
      res as Response,
    );

    expect(sendBadRequestStub.calledOnce).to.be.true;

    expect(
      sendBadRequestStub.calledWith(
        res,
        "Invalid leave ID",
      ),
    ).to.be.true;
  });

  // Internal server error
  it("should return internal server error when database operation fails", async () => {
    const findByIdStub = sinon.stub(
      Leave,
      "findById",
    ) as sinon.SinonStub;

    findByIdStub.throws(
      new Error("Database error"),
    );

    const sendInternalServerErrorStub = sinon.stub(
      responseHelper,
      "sendInternalServerError",
    );

    await leaveStatusUpdate(
      req as Request,
      res as Response,
    );

    expect(
      sendInternalServerErrorStub.calledOnce,
    ).to.be.true;

    expect(
      sendInternalServerErrorStub.calledWith(
        res,
        "Failed to update leave status",
      ),
    ).to.be.true;
  });
});