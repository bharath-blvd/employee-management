import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";

import { getEmployeesByDepartment } from "../controllers/getEmployeesByDepartmentHandler";
import { Employee } from "../models/employeeSchema";

import * as responseHelper from "../utils/responseHelper";

describe("getEmployeesByDepartment", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      user: {
        employeeId: "manager123",
        role: "manager",
        department: "department123",
        reportsTo: "manager456",
      } as any,
    };

    res = {} as Response;
  });

  afterEach(() => {
    sinon.restore();
  });

  // 1. User is not a manager
  it("should return forbidden if user is not a manager", async () => {
    req.user = {
      employeeId: "employee123",
      role: "employee",
      department: "department123",
    } as any;

    const sendForbiddenStub = sinon.stub(
      responseHelper,
      "sendForbidden",
    );

    await getEmployeesByDepartment(
      req as Request,
      res as Response,
    );

    expect(sendForbiddenStub.calledOnce).to.be.true;

    expect(
      sendForbiddenStub.calledWith(
        res,
        "only manager can view department employees",
      ),
    ).to.be.true;
  });

  // 2. Manager successfully gets employees
  it("should return employees belonging to the manager's department", async () => {
    const employees = [
      {
        name: "John",
        email: "john@gmail.com",
        designation: "Developer",
      },
      {
        name: "David",
        email: "david@gmail.com",
        designation: "Tester",
      },
    ];

    // Mock Mongoose query chain
    const mockQuery: any = {
      select: sinon.stub(),
      populate: sinon.stub(),
      then: function (resolve: any) {
        return resolve(employees);
      },
    };

    // Mongoose methods return the same query
    mockQuery.select.returns(mockQuery);
    mockQuery.populate.returns(mockQuery);

    // Create Sinon stub
    const employeeFindStub =
      sinon.stub(Employee, "find") as sinon.SinonStub;

    employeeFindStub.returns(mockQuery);

    const sendSuccessStub = sinon.stub(
      responseHelper,
      "sendSuccessResponse",
    );

    await getEmployeesByDepartment(
      req as Request,
      res as Response,
    );

    // Employee.find() should be called
    expect(employeeFindStub.calledOnce).to.be.true;

    // Correct department and isDeleted filter
    expect(
      employeeFindStub.calledWith({
        department: "department123",
        isDeleted: false,
      }),
    ).to.be.true;

    // select() should be called
    expect(mockQuery.select.calledOnce).to.be.true;

    // populate() should be called 3 times
    expect(mockQuery.populate.callCount).to.equal(3);

    // Success response should be called
    expect(sendSuccessStub.calledOnce).to.be.true;

    expect(
      sendSuccessStub.calledWith(
        res,
        "department employees fetched successfull",
        employees,
      ),
    ).to.be.true;
  });

  // 3. CastError
  it("should return not found when a CastError occurs", async () => {
    const castError: any = {
      name: "CastError",
    };

    const employeeFindStub =
      sinon.stub(Employee, "find") as sinon.SinonStub;

    employeeFindStub.throws(castError);

    const sendNotFoundStub = sinon.stub(
      responseHelper,
      "sendNotFound",
    );

    await getEmployeesByDepartment(
      req as Request,
      res as Response,
    );

    expect(sendNotFoundStub.calledOnce).to.be.true;

    expect(
      sendNotFoundStub.calledWith(
        res,
        "Employee ID is incorrect",
      ),
    ).to.be.true;
  });

  // 4. Other database error
  it("should return internal server error for other errors", async () => {
    const databaseError = new Error(
      "Database connection failed",
    );

    const employeeFindStub =
      sinon.stub(Employee, "find") as sinon.SinonStub;

    employeeFindStub.throws(databaseError);

    const sendInternalServerErrorStub = sinon.stub(
      responseHelper,
      "sendInternalServerError",
    );

    await getEmployeesByDepartment(
      req as Request,
      res as Response,
    );

    expect(
      sendInternalServerErrorStub.calledOnce,
    ).to.be.true;

    expect(
      sendInternalServerErrorStub.calledWith(
        res,
        "Failed to fetch department employees",
      ),
    ).to.be.true;
  });
});