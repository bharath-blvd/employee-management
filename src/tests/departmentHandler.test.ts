import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";

import { Department } from "../models/departmentSchema";
import {
  createDepartment,
  getDepartments,
} from "../controllers/departmentHandler";

import * as responseHelper from "../utils/responseHelper";

describe("Department Handler", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  afterEach(() => {
    sinon.restore();
  });

  // =========================================================
  // CREATE DEPARTMENT
  // =========================================================

  describe("createDepartment", () => {
    it("should create department successfully", async () => {
      req = {
        body: {
          name: "Testing",
          description: "Testing Department",
        },
      };

      res = {} as Response;

      const createStub = sinon
        .stub(Department, "create")
        .resolves(req.body as any);

      const successStub = sinon
        .stub(responseHelper, "sendCreatedResponse")
        .returns(res as Response);

      await createDepartment(req as Request, res as Response);

      expect(createStub.calledOnce).to.equal(true);

      expect(createStub.firstCall.args[0]).to.deep.equal({
        name: "Testing",
        description: "Testing Department",
      });

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[0]).to.equal(res);

      expect(successStub.firstCall.args[1]).to.equal(
        "Department created successfully",
      );
    });

    it("should return bad request when name is missing", async () => {
      req = {
        body: {
          description: "Testing Department",
        },
      };

      res = {} as Response;

      const badRequestStub = sinon
        .stub(responseHelper, "sendBadRequest")
        .returns(res as Response);

      const createStub = sinon.stub(Department, "create");

      await createDepartment(req as Request, res as Response);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[0]).to.equal(res);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "All fields are required",
      );

      expect(createStub.notCalled).to.equal(true);
    });

    it("should return bad request when description is missing", async () => {
      req = {
        body: {
          name: "Testing",
        },
      };

      res = {} as Response;

      const badRequestStub = sinon
        .stub(responseHelper, "sendBadRequest")
        .returns(res as Response);

      const createStub = sinon.stub(Department, "create");

      await createDepartment(req as Request, res as Response);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "All fields are required",
      );

      expect(createStub.notCalled).to.equal(true);
    });

    it("should return bad request when both name and description are missing", async () => {
      req = {
        body: {},
      };

      res = {} as Response;

      const badRequestStub = sinon
        .stub(responseHelper, "sendBadRequest")
        .returns(res as Response);

      const createStub = sinon.stub(Department, "create");

      await createDepartment(req as Request, res as Response);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "All fields are required",
      );

      expect(createStub.notCalled).to.equal(true);
    });

    it("should return bad request when request body is missing", async () => {
      req = {
        body: undefined,
      };

      res = {} as Response;

      const badRequestStub = sinon
        .stub(responseHelper, "sendBadRequest")
        .returns(res as Response);

      const createStub = sinon.stub(Department, "create");

      await createDepartment(req as Request, res as Response);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "All fields are required",
      );

      expect(createStub.notCalled).to.equal(true);
    });

    it("should return internal server error when department creation fails", async () => {
      req = {
        body: {
          name: "Testing",
          description: "Testing Department",
        },
      };

      res = {} as Response;

      sinon
        .stub(Department, "create")
        .rejects(new Error("Database error"));

      const internalServerErrorStub = sinon
        .stub(responseHelper, "sendInternalServerError")
        .returns(res as Response);

      await createDepartment(req as Request, res as Response);

      expect(internalServerErrorStub.calledOnce).to.equal(true);

      expect(internalServerErrorStub.firstCall.args[0]).to.equal(res);

      expect(internalServerErrorStub.firstCall.args[1]).to.equal(
        "Failed to create department",
      );
    });
  });

  // =========================================================
  // GET DEPARTMENTS
  // =========================================================

  describe("getDepartments", () => {
    it("should fetch all departments successfully", async () => {
      req = {};

      res = {} as Response;

      const departments = [
        {
          _id: "department1",
          name: "Testing",
          description: "Testing Department",
        },
        {
          _id: "department2",
          name: "IT",
          description: "IT Department",
        },
      ];

      const findStub = sinon
        .stub(Department, "find")
        .resolves(departments as any);

      const successStub = sinon
        .stub(responseHelper, "sendSuccessResponse")
        .returns(res as Response);

      await getDepartments(req as Request, res as Response);

      expect(findStub.calledOnce).to.equal(true);

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[0]).to.equal(res);

      expect(successStub.firstCall.args[1]).to.equal(
        "Departments fetched successfully",
      );

      expect(successStub.firstCall.args[2]).to.deep.equal(
        departments,
      );
    });

    it("should return an empty department list when no departments exist", async () => {
      req = {};

      res = {} as Response;

      const departments: any[] = [];

      const findStub = sinon
        .stub(Department, "find")
        .resolves(departments);

      const successStub = sinon
        .stub(responseHelper, "sendSuccessResponse")
        .returns(res as Response);

      await getDepartments(req as Request, res as Response);

      expect(findStub.calledOnce).to.equal(true);

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[2]).to.deep.equal([]);
    });

    it("should return internal server error when fetching departments fails", async () => {
      req = {};

      res = {} as Response;

      sinon
        .stub(Department, "find")
        .rejects(new Error("Database error"));

      const internalServerErrorStub = sinon
        .stub(responseHelper, "sendInternalServerError")
        .returns(res as Response);

      await getDepartments(req as Request, res as Response);

      expect(internalServerErrorStub.calledOnce).to.equal(true);

      expect(internalServerErrorStub.firstCall.args[0]).to.equal(res);

      expect(internalServerErrorStub.firstCall.args[1]).to.equal(
        "Failed to fetch departments",
      );
    });
  });
});