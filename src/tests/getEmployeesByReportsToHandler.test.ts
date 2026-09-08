import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";

import { getEmployeesByReportsTo } from "../controllers/getEmployeesByReportsToHandler";
import { Employee } from "../models/employeeSchema";

import * as responseHelper from "../utils/responseHelper";

describe("Get Employees By ReportsTo Handler", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  let forbiddenStub: sinon.SinonStub;
  let notFoundStub: sinon.SinonStub;
  let successStub: sinon.SinonStub;
  let internalServerErrorStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      user: {
        employeeId: "hari123",
        role: "employee",
        department: "dept123",
      } as any,
    };

    res = {} as Response;

    forbiddenStub = sinon
      .stub(responseHelper, "sendForbidden")
      .returns(undefined as any);

    notFoundStub = sinon
      .stub(responseHelper, "sendNotFound")
      .returns(undefined as any);

    successStub = sinon
      .stub(responseHelper, "sendSuccessResponse")
      .returns(undefined as any);

    internalServerErrorStub = sinon
      .stub(responseHelper, "sendInternalServerError")
      .returns(undefined as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  // Helper function to create a fake Mongoose query
  const createFakeQuery = (result: any) => {
    const query: any = {
      select: sinon.stub(),
      populate: sinon.stub(),
    };

    query.select.returns(query);
    query.populate.returns(query);

    // Allow the fake query to work with await
    query.then = (
      resolve: (value: any) => any,
      reject: (reason?: any) => any,
    ) => {
      return Promise.resolve(result).then(resolve, reject);
    };

    return query;
  };

  // ==================================================
  // UNAUTHORIZED
  // ==================================================

  describe("Unauthorized user", () => {
    it("should return forbidden when user is not available", async () => {
      req.user = undefined;

      await getEmployeesByReportsTo(
        req as Request,
        res as Response,
      );

      expect(forbiddenStub.calledOnce).to.equal(true);

      expect(
        forbiddenStub.calledWith(
          res,
          "Unauthorized",
        ),
      ).to.equal(true);
    });
  });

  // ==================================================
  // SUCCESS
  // ==================================================

  describe("Get reporting employees", () => {
    it("should fetch employees who report to the logged-in user", async () => {
      const employees = [
        {
          _id: "employee1",
          name: "Employee A",
          reportsTo: "hari123",
          isDeleted: false,
        },
        {
          _id: "employee2",
          name: "Employee B",
          reportsTo: "hari123",
          isDeleted: false,
        },
      ];

      const fakeQuery = createFakeQuery(employees);

      const findStub = sinon
        .stub(Employee, "find")
        .returns(fakeQuery);

      await getEmployeesByReportsTo(
        req as Request,
        res as Response,
      );

      // Employee.find() should be called once
      expect(findStub.calledOnce).to.equal(true);

      // Check the filter passed to Employee.find()
      const filter = findStub.firstCall.args[0] as any;

      expect(filter.reportsTo).to.equal("hari123");
      expect(filter.isDeleted).to.equal(false);

      // Success response should be sent
      expect(successStub.calledOnce).to.equal(true);

      expect(
        successStub.calledWith(
          res,
          "Reporting employees fetched successfully",
          employees,
        ),
      ).to.equal(true);
    });

    it("should work when the logged-in user is an employee", async () => {
      req.user = {
        employeeId: "employee123",
        role: "employee",
        department: "dept123",
      } as any;

      const employees = [
        {
          _id: "employee456",
          name: "Employee B",
          reportsTo: "employee123",
        },
      ];

      const fakeQuery = createFakeQuery(employees);

      const findStub = sinon
        .stub(Employee, "find")
        .returns(fakeQuery);

      await getEmployeesByReportsTo(
        req as Request,
        res as Response,
      );

      expect(findStub.calledOnce).to.equal(true);

      const filter = findStub.firstCall.args[0] as any;

      expect(filter.reportsTo).to.equal("employee123");
      expect(filter.isDeleted).to.equal(false);

      expect(successStub.calledOnce).to.equal(true);

      expect(
        successStub.calledWith(
          res,
          "Reporting employees fetched successfully",
          employees,
        ),
      ).to.equal(true);
    });

    it("should work when the logged-in user is a manager", async () => {
      req.user = {
        employeeId: "manager123",
        role: "manager",
        department: "dept123",
      } as any;

      const employees = [
        {
          _id: "employee456",
          name: "Employee B",
          reportsTo: "manager123",
        },
      ];

      const fakeQuery = createFakeQuery(employees);

      const findStub = sinon
        .stub(Employee, "find")
        .returns(fakeQuery);

      await getEmployeesByReportsTo(
        req as Request,
        res as Response,
      );

      expect(findStub.calledOnce).to.equal(true);

      const filter = findStub.firstCall.args[0] as any;

      expect(filter.reportsTo).to.equal("manager123");
      expect(filter.isDeleted).to.equal(false);

      expect(successStub.calledOnce).to.equal(true);

      expect(
        successStub.calledWith(
          res,
          "Reporting employees fetched successfully",
          employees,
        ),
      ).to.equal(true);
    });
  });

  // ==================================================
  // NO REPORTING EMPLOYEES
  // ==================================================

  describe("No reporting employees", () => {
    it("should return not found when no employees report to the user", async () => {
      const fakeQuery = createFakeQuery([]);

      const findStub = sinon
        .stub(Employee, "find")
        .returns(fakeQuery);

      await getEmployeesByReportsTo(
        req as Request,
        res as Response,
      );

      expect(findStub.calledOnce).to.equal(true);

      const filter = findStub.firstCall.args[0] as any;

      expect(filter.reportsTo).to.equal("hari123");
      expect(filter.isDeleted).to.equal(false);

      expect(notFoundStub.calledOnce).to.equal(true);

      expect(
        notFoundStub.calledWith(
          res,
          "No employees found reporting to you",
        ),
      ).to.equal(true);
    });
  });

  // ==================================================
  // CAST ERROR
  // ==================================================

  describe("CastError", () => {
    it("should return not found when employee ID is invalid", async () => {
      const castError: any = new Error(
        "Cast to ObjectId failed",
      );

      castError.name = "CastError";

      const fakeQuery = createFakeQuery(
        Promise.reject(castError),
      );

      sinon
        .stub(Employee, "find")
        .returns(fakeQuery);

      await getEmployeesByReportsTo(
        req as Request,
        res as Response,
      );

      expect(notFoundStub.calledOnce).to.equal(true);

      expect(
        notFoundStub.calledWith(
          res,
          "Invalid employee ID",
        ),
      ).to.equal(true);
    });
  });

  // ==================================================
  // INTERNAL SERVER ERROR
  // ==================================================

  describe("Internal server error", () => {
    it("should return internal server error when database operation fails", async () => {
      const dbError: any = new Error(
        "Database connection failed",
      );

      const fakeQuery = createFakeQuery(
        Promise.reject(dbError),
      );

      sinon
        .stub(Employee, "find")
        .returns(fakeQuery);

      await getEmployeesByReportsTo(
        req as Request,
        res as Response,
      );

      expect(
        internalServerErrorStub.calledOnce,
      ).to.equal(true);

      expect(
        internalServerErrorStub.calledWith(
          res,
          "Failed to fetch reporting employees",
        ),
      ).to.equal(true);
    });
  });

  // ==================================================
  // QUERY AND POPULATION
  // ==================================================

  describe("Query and population", () => {
    it("should exclude sensitive employee fields", async () => {
      const employees = [
        {
          _id: "employee1",
          name: "Employee A",
        },
      ];

      const fakeQuery = createFakeQuery(employees);

      sinon
        .stub(Employee, "find")
        .returns(fakeQuery);

      await getEmployeesByReportsTo(
        req as Request,
        res as Response,
      );

      expect(fakeQuery.select.calledOnce).to.equal(true);

      expect(
        fakeQuery.select.calledWith(
          "-password -createdAt -updatedAt -__v -leaveBalance._id",
        ),
      ).to.equal(true);
    });

    it("should populate role, department and reportsTo", async () => {
      const employees = [
        {
          _id: "employee1",
          name: "Employee A",
        },
      ];

      const fakeQuery = createFakeQuery(employees);

      sinon
        .stub(Employee, "find")
        .returns(fakeQuery);

      await getEmployeesByReportsTo(
        req as Request,
        res as Response,
      );

      // Three populate calls should be made
      expect(fakeQuery.populate.callCount).to.equal(3);

      // Role population
      expect(
        fakeQuery.populate.calledWith({
          path: "role",
          select: "roleName -_id",
        }),
      ).to.equal(true);

      // Department population
      expect(
        fakeQuery.populate.calledWith({
          path: "department",
          select: "name -_id",
        }),
      ).to.equal(true);

      // ReportsTo population
      expect(
        fakeQuery.populate.calledWith({
          path: "reportsTo",
          select: "name designation -_id",
        }),
      ).to.equal(true);
    });
  });
});