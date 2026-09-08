import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";

import { getLeavesByReportsTo } from "../controllers/getLeavesByReportsToHandler";
import { Employee } from "../models/employeeSchema";
import { Leave } from "../models/leaveSchema";

import * as responseHelper from "../utils/responseHelper";

describe("getLeavesByReportsTo", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      user: {
        employeeId: "manager123",
        role: "manager",
        department: "department123",
      } as any,
    };

    res = {} as Response;
  });

  afterEach(() => {
    sinon.restore();
  });

  // 1. User is not authenticated
  it("should return forbidden if user is not authenticated", async () => {
    req.user = undefined;

    const sendForbiddenStub = sinon.stub(
      responseHelper,
      "sendForbidden",
    );

    await getLeavesByReportsTo(
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

  // 2. No employees report to the manager
  it("should return not found if no employees report to the manager", async () => {
    const mockEmployeeQuery: any = {
      select: sinon.stub(),
      then: (resolve: any) => resolve([]),
    };

    mockEmployeeQuery.select.returns(mockEmployeeQuery);

    const employeeFindStub = sinon.stub(
      Employee,
      "find",
    ) as sinon.SinonStub;

    employeeFindStub.returns(mockEmployeeQuery);

    const sendNotFoundStub = sinon.stub(
      responseHelper,
      "sendNotFound",
    );

    await getLeavesByReportsTo(
      req as Request,
      res as Response,
    );

    expect(employeeFindStub.calledOnce).to.be.true;

    expect(
      employeeFindStub.calledWith({
        reportsTo: "manager123",
        isDeleted: false,
      }),
    ).to.be.true;

    expect(mockEmployeeQuery.select.calledOnce).to.be.true;

    expect(
      mockEmployeeQuery.select.calledWith("_id"),
    ).to.be.true;

    expect(sendNotFoundStub.calledOnce).to.be.true;

    expect(
      sendNotFoundStub.calledWith(
        res,
        "No employees report to you",
      ),
    ).to.be.true;
  });

  // 3. Employees and leaves are found
  it("should return reportee leaves successfully", async () => {
    const employees = [
      {
        _id: "employee123",
      },
      {
        _id: "employee456",
      },
    ];

    const leaves = [
      {
        user: "employee123",
        leaveType: "annual",
        leaveDays: 2,
        status: "pending",
      },
      {
        user: "employee456",
        leaveType: "sick",
        leaveDays: 1,
        status: "approved",
      },
    ];

    // Mock Employee.find().select()
    const mockEmployeeQuery: any = {
      select: sinon.stub(),
      then: (resolve: any) => resolve(employees),
    };

    mockEmployeeQuery.select.returns(mockEmployeeQuery);

    const employeeFindStub = sinon.stub(
      Employee,
      "find",
    ) as sinon.SinonStub;

    employeeFindStub.returns(mockEmployeeQuery);

    // Mock Leave.find().select().populate().populate()
    const mockLeaveQuery: any = {
      select: sinon.stub(),
      populate: sinon.stub(),
      then: (resolve: any) => resolve(leaves),
    };

    mockLeaveQuery.select.returns(mockLeaveQuery);
    mockLeaveQuery.populate.returns(mockLeaveQuery);

    const leaveFindStub = sinon.stub(
      Leave,
      "find",
    ) as sinon.SinonStub;

    leaveFindStub.returns(mockLeaveQuery);

    const sendSuccessStub = sinon.stub(
      responseHelper,
      "sendSuccessResponse",
    );

    await getLeavesByReportsTo(
      req as Request,
      res as Response,
    );

    // Employee.find() should be called
    expect(employeeFindStub.calledOnce).to.be.true;

    expect(
      employeeFindStub.calledWith({
        reportsTo: "manager123",
        isDeleted: false,
      }),
    ).to.be.true;

    // Employee select("_id")
    expect(mockEmployeeQuery.select.calledOnce).to.be.true;

    expect(
      mockEmployeeQuery.select.calledWith("_id"),
    ).to.be.true;

    // Leave.find() should be called with reportee IDs
    expect(leaveFindStub.calledOnce).to.be.true;

    expect(
      leaveFindStub.calledWith({
        user: {
          $in: ["employee123", "employee456"],
        },
      }),
    ).to.be.true;

    // Leave select()
    expect(mockLeaveQuery.select.calledOnce).to.be.true;

    expect(
      mockLeaveQuery.select.calledWith(
        "-createdAt -updatedAt -__v",
      ),
    ).to.be.true;

    // Two populate() calls
    expect(mockLeaveQuery.populate.callCount).to.equal(2);

    // Success response
    expect(sendSuccessStub.calledOnce).to.be.true;

    expect(
      sendSuccessStub.calledWith(
        res,
        "Reportee leaves fetched successfully",
        leaves,
      ),
    ).to.be.true;
  });

  // 4. Employees exist but no leaves are found
  it("should return not found if no leaves are found for reportees", async () => {
    const employees = [
      {
        _id: "employee123",
      },
    ];

    // Mock Employee.find().select()
    const mockEmployeeQuery: any = {
      select: sinon.stub(),
      then: (resolve: any) => resolve(employees),
    };

    mockEmployeeQuery.select.returns(mockEmployeeQuery);

    const employeeFindStub = sinon.stub(
      Employee,
      "find",
    ) as sinon.SinonStub;

    employeeFindStub.returns(mockEmployeeQuery);

    // Mock Leave.find() returning empty array
    const mockLeaveQuery: any = {
      select: sinon.stub(),
      populate: sinon.stub(),
      then: (resolve: any) => resolve([]),
    };

    mockLeaveQuery.select.returns(mockLeaveQuery);
    mockLeaveQuery.populate.returns(mockLeaveQuery);

    const leaveFindStub = sinon.stub(
      Leave,
      "find",
    ) as sinon.SinonStub;

    leaveFindStub.returns(mockLeaveQuery);

    const sendNotFoundStub = sinon.stub(
      responseHelper,
      "sendNotFound",
    );

    await getLeavesByReportsTo(
      req as Request,
      res as Response,
    );

    expect(employeeFindStub.calledOnce).to.be.true;

    expect(leaveFindStub.calledOnce).to.be.true;

    expect(sendNotFoundStub.calledOnce).to.be.true;

    expect(
      sendNotFoundStub.calledWith(
        res,
        "No leaves found for your reportees",
      ),
    ).to.be.true;
  });

  // 5. CastError
  it("should return not found when a CastError occurs", async () => {
    const castError: any = {
      name: "CastError",
    };

    const employeeFindStub = sinon.stub(
      Employee,
      "find",
    ) as sinon.SinonStub;

    employeeFindStub.throws(castError);

    const sendNotFoundStub = sinon.stub(
      responseHelper,
      "sendNotFound",
    );

    await getLeavesByReportsTo(
      req as Request,
      res as Response,
    );

    expect(sendNotFoundStub.calledOnce).to.be.true;

    expect(
      sendNotFoundStub.calledWith(
        res,
        "Invalid employee ID",
      ),
    ).to.be.true;
  });

  // 6. Other database error
  it("should return internal server error for other errors", async () => {
    const databaseError = new Error(
      "Database connection failed",
    );

    const employeeFindStub = sinon.stub(
      Employee,
      "find",
    ) as sinon.SinonStub;

    employeeFindStub.throws(databaseError);

    const sendInternalServerErrorStub = sinon.stub(
      responseHelper,
      "sendInternalServerError",
    );

    await getLeavesByReportsTo(
      req as Request,
      res as Response,
    );

    expect(
      sendInternalServerErrorStub.calledOnce,
    ).to.be.true;

    expect(
      sendInternalServerErrorStub.calledWith(
        res,
        "Failed to fetch reportee leaves",
      ),
    ).to.be.true;
  });
});