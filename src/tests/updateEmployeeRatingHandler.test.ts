import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";

import { updateEmployeeRating } from "../controllers/updateEmployeeRatingHandler";
import { Employee } from "../models/employeeSchema";

import * as responseHelper from "../utils/responseHelper";

describe("updateEmployeeRating", () => {
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
        _id: "employee123",
      },

      body: {
        rating: 4,
      },
    };

    res = {} as Response;
  });

  afterEach(() => {
    sinon.restore();
  });

  // Unauthorized role
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

    await updateEmployeeRating(
      req as Request,
      res as Response,
    );

    expect(sendForbiddenStub.calledOnce).to.be.true;

    expect(
      sendForbiddenStub.calledWith(
        res,
        "Only manager can give performance rating",
      ),
    ).to.be.true;
  });

  // Missing rating
  it("should return bad request if rating is missing", async () => {
    req.body = {};

    const sendBadRequestStub = sinon.stub(
      responseHelper,
      "sendBadRequest",
    );

    await updateEmployeeRating(
      req as Request,
      res as Response,
    );

    expect(sendBadRequestStub.calledOnce).to.be.true;

    expect(
      sendBadRequestStub.calledWith(
        res,
        "Only rating is allowed",
      ),
    ).to.be.true;
  });

  // Extra fields
  it("should return bad request if additional fields are provided", async () => {
    req.body = {
      rating: 4,
      comment: "Good performance",
    };

    const sendBadRequestStub = sinon.stub(
      responseHelper,
      "sendBadRequest",
    );

    await updateEmployeeRating(
      req as Request,
      res as Response,
    );

    expect(sendBadRequestStub.calledOnce).to.be.true;

    expect(
      sendBadRequestStub.calledWith(
        res,
        "Only rating is allowed",
      ),
    ).to.be.true;
  });

  // Rating below allowed range
  it("should return bad request if rating is less than 1", async () => {
    req.body = {
      rating: 0,
    };

    const sendBadRequestStub = sinon.stub(
      responseHelper,
      "sendBadRequest",
    );

    await updateEmployeeRating(
      req as Request,
      res as Response,
    );

    expect(sendBadRequestStub.calledOnce).to.be.true;

    expect(
      sendBadRequestStub.calledWith(
        res,
        "Rating must be between 1 and 5",
      ),
    ).to.be.true;
  });

  // Rating above allowed range
  it("should return bad request if rating is greater than 5", async () => {
    req.body = {
      rating: 6,
    };

    const sendBadRequestStub = sinon.stub(
      responseHelper,
      "sendBadRequest",
    );

    await updateEmployeeRating(
      req as Request,
      res as Response,
    );

    expect(sendBadRequestStub.calledOnce).to.be.true;

    expect(
      sendBadRequestStub.calledWith(
        res,
        "Rating must be between 1 and 5",
      ),
    ).to.be.true;
  });

  // Employee not found
  it("should return not found if employee does not exist", async () => {
    const findOneStub = sinon.stub(
      Employee,
      "findOne",
    ) as sinon.SinonStub;

    findOneStub.resolves(null);

    const sendNotFoundStub = sinon.stub(
      responseHelper,
      "sendNotFound",
    );

    await updateEmployeeRating(
      req as Request,
      res as Response,
    );

    expect(findOneStub.calledOnce).to.be.true;

    expect(
      findOneStub.args[0][0],
    ).to.deep.equal({
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

  // Employee belongs to different department
  it("should return forbidden if employee belongs to another department", async () => {
    const employee = {
      _id: "employee123",
      department: "anotherDepartment",
      rating: 3,
    };

    const findOneStub = sinon.stub(
      Employee,
      "findOne",
    ) as sinon.SinonStub;

    findOneStub.resolves(employee);

    const sendForbiddenStub = sinon.stub(
      responseHelper,
      "sendForbidden",
    );

    await updateEmployeeRating(
      req as Request,
      res as Response,
    );

    expect(findOneStub.calledOnce).to.be.true;

    expect(sendForbiddenStub.calledOnce).to.be.true;

    expect(
      sendForbiddenStub.calledWith(
        res,
        "Manager can rate only employees in their department",
      ),
    ).to.be.true;
  });

  // Successful rating update
  it("should update employee rating successfully", async () => {
    const employee = {
      _id: "employee123",
      department: "department123",
      rating: 3,
      save: sinon.stub().resolves(),
    };

    const findOneStub = sinon.stub(
      Employee,
      "findOne",
    ) as sinon.SinonStub;

    findOneStub.resolves(employee);

    const sendSuccessResponseStub = sinon.stub(
      responseHelper,
      "sendSuccessResponse",
    );

    await updateEmployeeRating(
      req as Request,
      res as Response,
    );

    expect(findOneStub.calledOnce).to.be.true;

    expect(
      findOneStub.args[0][0],
    ).to.deep.equal({
      _id: "employee123",
      isDeleted: false,
    });

    expect(employee.rating).to.equal(4);

    expect(employee.save.calledOnce).to.be.true;

    expect(
      sendSuccessResponseStub.calledOnce,
    ).to.be.true;

    expect(
      sendSuccessResponseStub.calledWith(
        res,
        "Employee rating updated successfully",
      ),
    ).to.be.true;
  });

  // CastError
  it("should return not found if employee ID is invalid", async () => {
    const castError: any = {
      name: "CastError",
    };

    const findOneStub = sinon.stub(
      Employee,
      "findOne",
    ) as sinon.SinonStub;

    findOneStub.throws(castError);

    const sendNotFoundStub = sinon.stub(
      responseHelper,
      "sendNotFound",
    );

    await updateEmployeeRating(
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

  // Internal server error
  it("should return internal server error when database operation fails", async () => {
    const findOneStub = sinon.stub(
      Employee,
      "findOne",
    ) as sinon.SinonStub;

    findOneStub.throws(
      new Error("Database error"),
    );

    const sendInternalServerErrorStub = sinon.stub(
      responseHelper,
      "sendInternalServerError",
    );

    await updateEmployeeRating(
      req as Request,
      res as Response,
    );

    expect(
      sendInternalServerErrorStub.calledOnce,
    ).to.be.true;

    expect(
      sendInternalServerErrorStub.calledWith(
        res,
        "Invalid operation",
      ),
    ).to.be.true;
  });
});