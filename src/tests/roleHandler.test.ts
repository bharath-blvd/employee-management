import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";

import { Role } from "../models/roleSchema";
import {
  createRole,
  getRoles,
} from "../controllers/roleHandler";

import * as responseHelper from "../utils/responseHelper";

describe("Role Handler", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  afterEach(() => {
    sinon.restore();
  });

  // =========================================================
  // CREATE ROLE
  // =========================================================

  describe("createRole", () => {
    it("should create role successfully", async () => {
      req = {
        body: {
          roleName: "manager",
        },
      };

      res = {} as Response;

      const findOneStub = sinon
        .stub(Role, "findOne")
        .resolves(null);

      const createStub = sinon
        .stub(Role, "create")
        .resolves(req.body as any);

      const successStub = sinon
        .stub(responseHelper, "sendCreatedResponse")
        .returns(res as Response);

      await createRole(req as Request, res as Response);

      expect(findOneStub.calledOnce).to.equal(true);

      expect(findOneStub.firstCall.args[0]).to.deep.equal({
        roleName: "manager",
      });

      expect(createStub.calledOnce).to.equal(true);

      expect(createStub.firstCall.args[0]).to.deep.equal({
        roleName: "manager",
      });

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[0]).to.equal(res);

      expect(successStub.firstCall.args[1]).to.equal(
        "role created successfully",
      );
    });

    it("should return bad request when role name is missing", async () => {
      req = {
        body: {},
      };

      res = {} as Response;

      const badRequestStub = sinon
        .stub(responseHelper, "sendBadRequest")
        .returns(res as Response);

      const findOneStub = sinon.stub(Role, "findOne");

      const createStub = sinon.stub(Role, "create");

      await createRole(req as Request, res as Response);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[0]).to.equal(res);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "role name is  required",
      );

      expect(findOneStub.notCalled).to.equal(true);

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

      const findOneStub = sinon.stub(Role, "findOne");

      const createStub = sinon.stub(Role, "create");

      await createRole(req as Request, res as Response);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "role name is  required",
      );

      expect(findOneStub.notCalled).to.equal(true);

      expect(createStub.notCalled).to.equal(true);
    });

    it("should return bad request when role already exists", async () => {
      req = {
        body: {
          roleName: "manager",
        },
      };

      res = {} as Response;

      const existingRole = {
        _id: "role123",
        roleName: "manager",
      };

      const findOneStub = sinon
        .stub(Role, "findOne")
        .resolves(existingRole as any);

      const createStub = sinon.stub(Role, "create");

      const badRequestStub = sinon
        .stub(responseHelper, "sendBadRequest")
        .returns(res as Response);

      await createRole(req as Request, res as Response);

      expect(findOneStub.calledOnce).to.equal(true);

      expect(findOneStub.firstCall.args[0]).to.deep.equal({
        roleName: "manager",
      });

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[0]).to.equal(res);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "role already exists",
      );

      expect(createStub.notCalled).to.equal(true);
    });

    it("should return internal server error when checking existing role fails", async () => {
      req = {
        body: {
          roleName: "manager",
        },
      };

      res = {} as Response;

      sinon
        .stub(Role, "findOne")
        .rejects(new Error("Database error"));

      const internalServerErrorStub = sinon
        .stub(responseHelper, "sendInternalServerError")
        .returns(res as Response);

      await createRole(req as Request, res as Response);

      expect(internalServerErrorStub.calledOnce).to.equal(true);

      expect(internalServerErrorStub.firstCall.args[0]).to.equal(res);

      expect(internalServerErrorStub.firstCall.args[1]).to.equal(
        "Failed to create role",
      );
    });

    it("should return internal server error when role creation fails", async () => {
      req = {
        body: {
          roleName: "manager",
        },
      };

      res = {} as Response;

      sinon
        .stub(Role, "findOne")
        .resolves(null);

      sinon
        .stub(Role, "create")
        .rejects(new Error("Database error"));

      const internalServerErrorStub = sinon
        .stub(responseHelper, "sendInternalServerError")
        .returns(res as Response);

      await createRole(req as Request, res as Response);

      expect(internalServerErrorStub.calledOnce).to.equal(true);

      expect(internalServerErrorStub.firstCall.args[0]).to.equal(res);

      expect(internalServerErrorStub.firstCall.args[1]).to.equal(
        "Failed to create role",
      );
    });
  });

  // =========================================================
  // GET ROLES
  // =========================================================

  describe("getRoles", () => {
    it("should fetch all roles successfully", async () => {
      req = {};

      res = {} as Response;

      const roles = [
        {
          _id: "role1",
          roleName: "employee",
        },
        {
          _id: "role2",
          roleName: "manager",
        },
        {
          _id: "role3",
          roleName: "hr",
        },
      ];

      const findStub = sinon
        .stub(Role, "find")
        .resolves(roles as any);

      const successStub = sinon
        .stub(responseHelper, "sendSuccessResponse")
        .returns(res as Response);

      await getRoles(req as Request, res as Response);

      expect(findStub.calledOnce).to.equal(true);

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[0]).to.equal(res);

      expect(successStub.firstCall.args[1]).to.equal(
        "roles fetched successfully",
      );

      expect(successStub.firstCall.args[2]).to.deep.equal(roles);
    });

    it("should return empty role list when no roles exist", async () => {
      req = {};

      res = {} as Response;

      const roles: any[] = [];

      const findStub = sinon
        .stub(Role, "find")
        .resolves(roles);

      const successStub = sinon
        .stub(responseHelper, "sendSuccessResponse")
        .returns(res as Response);

      await getRoles(req as Request, res as Response);

      expect(findStub.calledOnce).to.equal(true);

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[0]).to.equal(res);

      expect(successStub.firstCall.args[1]).to.equal(
        "roles fetched successfully",
      );

      expect(successStub.firstCall.args[2]).to.deep.equal([]);
    });

    it("should return internal server error when fetching roles fails", async () => {
      req = {};

      res = {} as Response;

      sinon
        .stub(Role, "find")
        .rejects(new Error("Database error"));

      const internalServerErrorStub = sinon
        .stub(responseHelper, "sendInternalServerError")
        .returns(res as Response);

      await getRoles(req as Request, res as Response);

      expect(internalServerErrorStub.calledOnce).to.equal(true);

      expect(internalServerErrorStub.firstCall.args[0]).to.equal(res);

      expect(internalServerErrorStub.firstCall.args[1]).to.equal(
        "Failed to fetch roles",
      );
    });
  });
});