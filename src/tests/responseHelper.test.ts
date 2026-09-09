import { expect } from "chai";
import sinon from "sinon";
import { Response } from "express";
import {
  sendBadRequest,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendInternalServerError,
  sendSuccessResponse,
  sendCreatedResponse,
} from "../utils/responseHelper";

describe("responseHelper", () => {
  let res: Response;
  let statusStub: sinon.SinonStub;
  let jsonStub: sinon.SinonStub;

  beforeEach(() => {
    jsonStub = sinon.stub();
    statusStub = sinon.stub().returns({
      json: jsonStub,
    });

    res = {
      status: statusStub,
    } as unknown as Response;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("sendBadRequest", () => {
    it("should return 400 status with message", () => {
      sendBadRequest(res, "Invalid request");

      expect(statusStub.calledWith(400)).to.be.true;
      expect(jsonStub.calledWith({
        message: "Invalid request",
      })).to.be.true;
    });
  });

  describe("sendNotFound", () => {
    it("should return 404 status with message", () => {
      sendNotFound(res, "Employee not found");

      expect(statusStub.calledWith(404)).to.be.true;
      expect(jsonStub.calledWith({
        message: "Employee not found",
      })).to.be.true;
    });
  });

  describe("sendUnauthorized", () => {
    it("should return 401 status with message", () => {
      sendUnauthorized(res, "Unauthorized");

      expect(statusStub.calledWith(401)).to.be.true;
      expect(jsonStub.calledWith({
        message: "Unauthorized",
      })).to.be.true;
    });
  });

  describe("sendForbidden", () => {
    it("should return 403 status with message", () => {
      sendForbidden(res, "Access denied");

      expect(statusStub.calledWith(403)).to.be.true;
      expect(jsonStub.calledWith({
        message: "Access denied",
      })).to.be.true;
    });
  });

  describe("sendInternalServerError", () => {
    it("should return 500 status with message", () => {
      sendInternalServerError(res, "Something went wrong");

      expect(statusStub.calledWith(500)).to.be.true;
      expect(jsonStub.calledWith({
        message: "Something went wrong",
      })).to.be.true;
    });
  });

  describe("sendSuccessResponse", () => {
    it("should return 200 status with message and data", () => {
      const data = {
        name: "John",
        role: "employee",
      };

      sendSuccessResponse(res, "Employee fetched successfully", data);

      expect(statusStub.calledWith(200)).to.be.true;
      expect(jsonStub.calledWith({
        message: "Employee fetched successfully",
        data,
      })).to.be.true;
    });

    it("should return 200 status with message when data is not provided", () => {
      sendSuccessResponse(res, "Operation successful");

      expect(statusStub.calledWith(200)).to.be.true;
      expect(jsonStub.calledWith({
        message: "Operation successful",
        data: undefined,
      })).to.be.true;
    });
  });

  describe("sendCreatedResponse", () => {
    it("should return 201 status with message and data", () => {
      const data = {
        name: "John",
        email: "john@gmail.com",
      };

      sendCreatedResponse(res, "Employee created successfully", data);

      expect(statusStub.calledWith(201)).to.be.true;
      expect(jsonStub.calledWith({
        message: "Employee created successfully",
        data,
      })).to.be.true;
    });

    it("should return 201 status with message when data is not provided", () => {
      sendCreatedResponse(res, "Employee created successfully");

      expect(statusStub.calledWith(201)).to.be.true;
      expect(jsonStub.calledWith({
        message: "Employee created successfully",
        data: undefined,
      })).to.be.true;
    });
  });
});