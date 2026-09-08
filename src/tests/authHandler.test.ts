import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";

import { login } from "../controllers/authHandler";
import { Employee } from "../models/employeeSchema";
import * as responseHelper from "../utils/responseHelper";

describe("login", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {
        email: "employee@gmail.com",
        password: "Password@123",
      },
    };

    res = {} as Response;
  });

  afterEach(() => {
    sinon.restore();
  });

  // 1. Email or password missing
  it("should return bad request if email or password is missing", async () => {
    req.body = {
      email: "employee@gmail.com",
    };

    const sendBadRequestStub = sinon.stub(
      responseHelper,
      "sendBadRequest",
    );

    await login(req as Request, res as Response);

    expect(sendBadRequestStub.calledOnce).to.be.true;

    expect(
      sendBadRequestStub.calledWith(
        res,
        "Email and password are required",
      ),
    ).to.be.true;
  });

  // 2. Employee not found
  it("should return not found if employee does not exist", async () => {
    const mockQuery: any = {
      populate: sinon.stub(),
      then: function (resolve: any) {
        return resolve(null);
      },
    };

    mockQuery.populate.returns(mockQuery);

    const employeeFindOneStub =
      sinon.stub(Employee, "findOne") as sinon.SinonStub;

    employeeFindOneStub.returns(mockQuery);

    const sendNotFoundStub = sinon.stub(
      responseHelper,
      "sendNotFound",
    );

    await login(req as Request, res as Response);

    expect(employeeFindOneStub.calledOnce).to.be.true;

    expect(
      employeeFindOneStub.calledWith({
        email: "employee@gmail.com",
        isDeleted: false,
      }),
    ).to.be.true;

    expect(mockQuery.populate.calledOnce).to.be.true;

    expect(
      mockQuery.populate.calledWith("role"),
    ).to.be.true;

    expect(sendNotFoundStub.calledOnce).to.be.true;

    expect(
      sendNotFoundStub.calledWith(
        res,
        "Employee not found",
      ),
    ).to.be.true;
  });

  // 3. Incorrect password
  it("should return unauthorized if password is incorrect", async () => {
    const employee = {
      _id: "employee123",
      password: "hashedPassword",
      role: {
        roleName: "employee",
      },
      department: "department123",
      reportsTo: "manager123",
      passwordResetRequired: false,
    };

    const mockQuery: any = {
      populate: sinon.stub(),
      then: function (resolve: any) {
        return resolve(employee);
      },
    };

    mockQuery.populate.returns(mockQuery);

    const employeeFindOneStub =
      sinon.stub(Employee, "findOne") as sinon.SinonStub;

    employeeFindOneStub.returns(mockQuery);

    sinon.stub(bcrypt, "compare").resolves(false);

    const sendUnauthorizedStub = sinon.stub(
      responseHelper,
      "sendUnauthorized",
    );

    await login(req as Request, res as Response);

    expect(sendUnauthorizedStub.calledOnce).to.be.true;

    expect(
      sendUnauthorizedStub.calledWith(
        res,
        "Incorrect password",
      ),
    ).to.be.true;
  });

  // 4. Successful login without password reset
  it("should login successfully when credentials are correct", async () => {
    const employee = {
      _id: "employee123",
      password: "hashedPassword",
      role: {
        roleName: "employee",
      },
      department: "department123",
      reportsTo: "manager123",
      passwordResetRequired: false,
    };

    const mockQuery: any = {
      populate: sinon.stub(),
      then: function (resolve: any) {
        return resolve(employee);
      },
    };

    mockQuery.populate.returns(mockQuery);

    const employeeFindOneStub =
      sinon.stub(Employee, "findOne") as sinon.SinonStub;

    employeeFindOneStub.returns(mockQuery);

    sinon.stub(bcrypt, "compare").resolves(true);

    const jwtSignStub =
      sinon.stub(Jwt, "sign") as sinon.SinonStub;

    jwtSignStub.returns("fake-jwt-token");

    const sendSuccessStub = sinon.stub(
      responseHelper,
      "sendSuccessResponse",
    );

    process.env.JWT_SECRET = "test-secret";

    await login(req as Request, res as Response);

    expect(jwtSignStub.calledOnce).to.be.true;

    expect(
      jwtSignStub.calledWith(
        {
          employeeId: employee._id,
          role: "employee",
          department: "department123",
          reportsTo: "manager123",
        },
        "test-secret",
        {
          expiresIn: "1h",
        },
      ),
    ).to.be.true;

    expect(sendSuccessStub.calledOnce).to.be.true;

    expect(
      sendSuccessStub.calledWith(
        res,
        "Login successful",
        {
          token: "fake-jwt-token",
          passwordResetRequired: false,
        },
      ),
    ).to.be.true;
  });

  // 5. Successful login but password reset is required
  it("should ask employee to change password when passwordResetRequired is true", async () => {
    const employee = {
      _id: "employee123",
      password: "hashedPassword",
      role: {
        roleName: "employee",
      },
      department: "department123",
      reportsTo: "manager123",
      passwordResetRequired: true,
    };

    const mockQuery: any = {
      populate: sinon.stub(),
      then: function (resolve: any) {
        return resolve(employee);
      },
    };

    mockQuery.populate.returns(mockQuery);

    const employeeFindOneStub =
      sinon.stub(Employee, "findOne") as sinon.SinonStub;

    employeeFindOneStub.returns(mockQuery);

    sinon.stub(bcrypt, "compare").resolves(true);

    const jwtSignStub =
      sinon.stub(Jwt, "sign") as sinon.SinonStub;

    jwtSignStub.returns("fake-jwt-token");

    const sendSuccessStub = sinon.stub(
      responseHelper,
      "sendSuccessResponse",
    );

    process.env.JWT_SECRET = "test-secret";

    await login(req as Request, res as Response);

    expect(sendSuccessStub.calledOnce).to.be.true;

    expect(
      sendSuccessStub.calledWith(
        res,
        "Login successful. Please change your temporary password.",
        {
          token: "fake-jwt-token",
          passwordResetRequired: true,
        },
      ),
    ).to.be.true;
  });

  // 6. Internal server error
  it("should return internal server error when login fails", async () => {
    const employeeFindOneStub =
      sinon.stub(Employee, "findOne") as sinon.SinonStub;

    employeeFindOneStub.throws(
      new Error("Database connection failed"),
    );

    const sendInternalServerErrorStub = sinon.stub(
      responseHelper,
      "sendInternalServerError",
    );

    await login(req as Request, res as Response);

    expect(
      sendInternalServerErrorStub.calledOnce,
    ).to.be.true;

    expect(
      sendInternalServerErrorStub.calledWith(
        res,
        "Login failed",
      ),
    ).to.be.true;
  });
});