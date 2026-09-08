import { expect } from "chai";
import sinon from "sinon";
import bcrypt from "bcrypt";

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeHandler";

import { Employee } from "../models/employeeSchema";

import * as responseHelper from "../utils/responseHelper";
import * as validationHelper from "../utils/validationHelper";
import * as passwordHelper from "../utils/passwordHelper";
import * as emailService from "../services/emailService";

describe("Employee Handler Unit Tests", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {},
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  // CREATE EMPLOYEE
  describe("createEmployee", () => {
    const validEmployee = {
      name: "John",
      email: "john@gmail.com",
      phone: "9876543210",
      department: "department123",
      designation: "Backend Developer",
      salary: 50000,
      joiningDate: "2026-09-01",
      role: "role123",
      reportsTo: "manager123",
    };

    beforeEach(() => {
      req.user = {
        role: "hr",
      };

      req.body = {
        ...validEmployee,
      };
    });

    // 1. SUCCESS

    it("should create employee successfully", async () => {
      sinon
        .stub(validationHelper, "isValidEmail")
        .returns(true);

      sinon
        .stub(validationHelper, "isValidPhone")
        .returns(true);

      const findOneStub = sinon
        .stub(Employee as any, "findOne")
        .resolves(null);

      sinon
        .stub(passwordHelper, "generateDefaultPassword")
        .returns("Temp@123");

      const hashStub = sinon
        .stub(bcrypt, "hash")
        .resolves("hashed-password");

      const createStub = sinon
        .stub(Employee as any, "create")
        .resolves({
          _id: "employee123",
          ...validEmployee,
          password: "hashed-password",
          passwordResetRequired: true,
        });

      const emailStub = sinon
        .stub(emailService, "sendOnboardingEmail")
        .resolves();

      const createdStub = sinon.stub(
        responseHelper,
        "sendCreatedResponse",
      );

      await createEmployee(req, res);

      // Email check
      expect(findOneStub.calledOnce).to.equal(true);

      expect(findOneStub.firstCall.args[0]).to.deep.equal({
        email: "john@gmail.com",
      });

      // Password check
      expect(hashStub.calledOnce).to.equal(true);

      expect(hashStub.firstCall.args[0]).to.equal(
        "Temp@123",
      );

      expect(hashStub.firstCall.args[1]).to.equal(10);

      // Employee creation check
      expect(createStub.calledOnce).to.equal(true);

      expect(createStub.firstCall.args[0]).to.deep.include({
        name: "John",
        email: "john@gmail.com",
        phone: "9876543210",
        department: "department123",
        designation: "Backend Developer",
        salary: 50000,
        joiningDate: "2026-09-01",
        role: "role123",
        reportsTo: "manager123",
        password: "hashed-password",
        passwordResetRequired: true,
      });

      // Onboarding email check
      expect(emailStub.calledOnce).to.equal(true);

      expect(emailStub.firstCall.args[0]).to.equal(
        "john@gmail.com",
      );

      expect(emailStub.firstCall.args[1]).to.equal(
        "John",
      );

      expect(emailStub.firstCall.args[2]).to.equal(
        "Temp@123",
      );

      // Response check
      expect(createdStub.calledOnce).to.equal(true);

      expect(createdStub.firstCall.args[1]).to.equal(
        "Employee created successfully. Login credentials have been sent to the employee's email.",
      );
    });

    // 2. NON HR USER

    it("should return forbidden when user is not HR", async () => {
      req.user = {
        role: "employee",
      };

      const forbiddenStub = sinon.stub(
        responseHelper,
        "sendForbidden",
      );

      await createEmployee(req, res);

      expect(forbiddenStub.calledOnce).to.equal(true);

      expect(forbiddenStub.firstCall.args[1]).to.equal(
        "Only HR is allowed to create employees",
      );
    });

    // 3. MISSING FIELDS

    it("should return bad request when fields are missing", async () => {
      req.body = {
        name: "John",
        email: "john@gmail.com",
      };

      const badRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await createEmployee(req, res);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "All fields are required",
      );
    });

    // 4. INVALID EMAIL

    it("should return bad request for invalid email", async () => {
      sinon
        .stub(validationHelper, "isValidEmail")
        .returns(false);

      const badRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await createEmployee(req, res);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "Invalid email format",
      );
    });

    // 5. INVALID PHONE

    it("should return bad request for invalid phone", async () => {
      sinon
        .stub(validationHelper, "isValidEmail")
        .returns(true);

      sinon
        .stub(validationHelper, "isValidPhone")
        .returns(false);

      const badRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await createEmployee(req, res);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "Invalid phone number",
      );
    });

    // 6. DUPLICATE EMAIL

    it("should return bad request when email already exists", async () => {
      sinon
        .stub(validationHelper, "isValidEmail")
        .returns(true);

      sinon
        .stub(validationHelper, "isValidPhone")
        .returns(true);

      const findOneStub = sinon
        .stub(Employee as any, "findOne")
        .resolves({
          _id: "existingEmployee",
          email: "john@gmail.com",
        });

      const badRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await createEmployee(req, res);

      expect(findOneStub.calledOnce).to.equal(true);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "email already exists",
      );
    });

    // 7. EMAIL SERVICE FAILURE

    it("should return internal server error when onboarding email fails", async () => {
      sinon
        .stub(validationHelper, "isValidEmail")
        .returns(true);

      sinon
        .stub(validationHelper, "isValidPhone")
        .returns(true);

      sinon
        .stub(Employee as any, "findOne")
        .resolves(null);

      sinon
        .stub(passwordHelper, "generateDefaultPassword")
        .returns("Temp@123");

      sinon
        .stub(bcrypt, "hash")
        .resolves("hashed-password");

      sinon
        .stub(Employee as any, "create")
        .resolves({
          _id: "employee123",
        });

      sinon
        .stub(emailService, "sendOnboardingEmail")
        .rejects(new Error("Email failed"));

      const errorStub = sinon.stub(
        responseHelper,
        "sendInternalServerError",
      );

      await createEmployee(req, res);

      expect(errorStub.calledOnce).to.equal(true);

      expect(errorStub.firstCall.args[1]).to.equal(
        "Failed to create employee",
      );
    });

    // 8. DATABASE ERROR

    it("should return internal server error when employee creation fails", async () => {
      sinon
        .stub(validationHelper, "isValidEmail")
        .returns(true);

      sinon
        .stub(validationHelper, "isValidPhone")
        .returns(true);

      sinon
        .stub(Employee as any, "findOne")
        .rejects(new Error("Database error"));

      const errorStub = sinon.stub(
        responseHelper,
        "sendInternalServerError",
      );

      await createEmployee(req, res);

      expect(errorStub.calledOnce).to.equal(true);

      expect(errorStub.firstCall.args[1]).to.equal(
        "Failed to create employee",
      );
    });
  });

  
  // GET ALL EMPLOYEES

  describe("getEmployees", () => {
    function createFindChain(result: any[] = []) {
      return {
        select: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        sort: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().resolves(result),
      };
    }

    // 9. HR SUCCESS

    it("should return employees for HR", async () => {
      req.user = {
        role: "hr",
      };

      const employees = [
        {
          _id: "employee1",
          name: "John",
        },
      ];

      const chain = createFindChain(employees);

      const findStub = sinon
        .stub(Employee as any, "find")
        .returns(chain as any);

      const successStub = sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getEmployees(req, res);

      expect(findStub.calledOnce).to.equal(true);

      const filter = findStub.firstCall.args[0] as any;

      expect(filter.isDeleted).to.equal(false);

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[1]).to.equal(
        "Employees fetched successfully",
      );

      expect(successStub.firstCall.args[2]).to.deep.equal(
        employees,
      );
    });

    // 10. ADMIN SUCCESS

    it("should return employees for Admin", async () => {
      req.user = {
        role: "admin",
      };

      const employees = [
        {
          _id: "employee1",
        },
      ];

      const chain = createFindChain(employees);

      sinon
        .stub(Employee as any, "find")
        .returns(chain as any);

      const successStub = sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getEmployees(req, res);

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[1]).to.equal(
        "Employees fetched successfully",
      );
    });

    // 11. FORBIDDEN EMPLOYEE
    

    it("should return forbidden for employee role", async () => {
      req.user = {
        role: "employee",
      };

      const forbiddenStub = sinon.stub(
        responseHelper,
        "sendForbidden",
      );

      await getEmployees(req, res);

      expect(forbiddenStub.calledOnce).to.equal(true);

      expect(forbiddenStub.firstCall.args[1]).to.equal(
        "Only HR and Admin can view all details",
      );
    });

    // 12. FORBIDDEN MANAGER

    it("should return forbidden for manager role", async () => {
      req.user = {
        role: "manager",
      };

      const forbiddenStub = sinon.stub(
        responseHelper,
        "sendForbidden",
      );

      await getEmployees(req, res);

      expect(forbiddenStub.calledOnce).to.equal(true);

      expect(forbiddenStub.firstCall.args[1]).to.equal(
        "Only HR and Admin can view all details",
      );
    });

    // 13. DEPARTMENT FILTER

    it("should apply department filter", async () => {
      req.user = {
        role: "hr",
      };

      req.query = {
        department: "department123",
      };

      const chain = createFindChain([]);

      const findStub = sinon
        .stub(Employee as any, "find")
        .returns(chain as any);

      sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getEmployees(req, res);

      const filter = findStub.firstCall.args[0] as any;

      expect(filter.isDeleted).to.equal(false);

      expect(filter.department).to.equal(
        "department123",
      );
    });

    // 14. STATUS FILTER

    it("should apply status filter", async () => {
      req.user = {
        role: "hr",
      };

      req.query = {
        status: "active",
      };

      const chain = createFindChain([]);

      const findStub = sinon
        .stub(Employee as any, "find")
        .returns(chain as any);

      sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getEmployees(req, res);

      const filter = findStub.firstCall.args[0] as any;

      expect(filter.status).to.equal("active");
    });

    // 15. SEARCH FILTER

    it("should apply search filter", async () => {
      req.user = {
        role: "hr",
      };

      req.query = {
        search: "john",
      };

      const chain = createFindChain([]);

      const findStub = sinon
        .stub(Employee as any, "find")
        .returns(chain as any);

      sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getEmployees(req, res);

      const filter = findStub.firstCall.args[0] as any;

      expect(filter.$or).to.be.an("array");

      expect(filter.$or).to.have.lengthOf(3);

      expect(filter.$or[0].name.$regex).to.equal(
        "john",
      );

      expect(filter.$or[0].name.$options).to.equal(
        "i",
      );

      expect(filter.$or[1].email.$regex).to.equal(
        "john",
      );

      expect(filter.$or[1].email.$options).to.equal(
        "i",
      );

      expect(
        filter.$or[2].designation.$regex,
      ).to.equal("john");

      expect(
        filter.$or[2].designation.$options,
      ).to.equal("i");
    });

    // 16. PAGINATION

    it("should apply pagination", async () => {
      req.user = {
        role: "hr",
      };

      req.query = {
        page: "2",
        limit: "5",
      };

      const chain = createFindChain([]);

      sinon
        .stub(Employee as any, "find")
        .returns(chain as any);

      sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getEmployees(req, res);

      expect(chain.skip.calledOnce).to.equal(true);

      expect(chain.skip.firstCall.args[0]).to.equal(
        5,
      );

      expect(chain.limit.calledOnce).to.equal(true);

      expect(chain.limit.firstCall.args[0]).to.equal(
        5,
      );
    });

    // 17. DEFAULT PAGINATION

    it("should use default page and limit", async () => {
      req.user = {
        role: "hr",
      };

      req.query = {};

      const chain = createFindChain([]);

      sinon
        .stub(Employee as any, "find")
        .returns(chain as any);

      sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getEmployees(req, res);

      expect(chain.skip.calledOnce).to.equal(true);

      expect(chain.skip.firstCall.args[0]).to.equal(
        0,
      );

      expect(chain.limit.calledOnce).to.equal(true);

      expect(chain.limit.firstCall.args[0]).to.equal(
        10,
      );
    });

    // 18. SORT

    it("should apply requested sort", async () => {
      req.user = {
        role: "hr",
      };

      req.query = {
        sort: "-salary",
      };

      const chain = createFindChain([]);

      sinon
        .stub(Employee as any, "find")
        .returns(chain as any);

      sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getEmployees(req, res);

      expect(chain.sort.calledOnce).to.equal(true);

      expect(chain.sort.firstCall.args[0]).to.equal(
        "-salary",
      );
    });

    // 19. CAST ERROR

    it("should return not found for CastError", async () => {
      req.user = {
        role: "hr",
      };

      const castError: any = new Error(
        "Cast error",
      );

      castError.name = "CastError";

      sinon
        .stub(Employee as any, "find")
        .throws(castError);

      const notFoundStub = sinon.stub(
        responseHelper,
        "sendNotFound",
      );

      await getEmployees(req, res);

      expect(notFoundStub.calledOnce).to.equal(true);

      expect(notFoundStub.firstCall.args[1]).to.equal(
        "Invalid filter value",
      );
    });

    // 20. INTERNAL ERROR

    it("should return internal server error when getEmployees fails", async () => {
      req.user = {
        role: "hr",
      };

      sinon
        .stub(Employee as any, "find")
        .throws(new Error("Database error"));

      const errorStub = sinon.stub(
        responseHelper,
        "sendInternalServerError",
      );

      await getEmployees(req, res);

      expect(errorStub.calledOnce).to.equal(true);

      expect(errorStub.firstCall.args[1]).to.equal(
        "Failed to fetch employees",
      );
    });
  });

  // GET EMPLOYEE BY ID

  describe("getEmployeeById", () => {
    

    function createEmployeeQuery(result: any) {
      return {
        select: sinon.stub().returnsThis(),

        populate: sinon.stub().returnsThis(),

        then: (
          resolve: (value: any) => any,
          reject?: (reason: any) => any,
        ) => {
          return Promise.resolve(result).then(
            resolve,
            reject,
          );
        },

        catch: (
          reject: (reason: any) => any,
        ) => {
          return Promise.resolve(result).catch(
            reject,
          );
        },
      };
    }

    // 21. HR SUCCESS

    it("should get employee by ID for HR", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "employee123",
      };

      const employee = {
        _id: "employee123",
        name: "John",
        department: {
          _id: "department123",
          name: "IT",
        },
      };

      const query = createEmployeeQuery(
        employee,
      );

      const findOneStub = sinon
        .stub(Employee as any, "findOne")
        .returns(query as any);

      const successStub = sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getEmployeeById(req, res);

      expect(findOneStub.calledOnce).to.equal(true);

      expect(
        findOneStub.firstCall.args[0],
      ).to.deep.equal({
        _id: "employee123",
        isDeleted: false,
      });

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[1]).to.equal(
        "Employee details fetched successfully",
      );

      expect(successStub.firstCall.args[2]).to.deep.equal(
        employee,
      );
    });

    // 22. EMPLOYEE CAN VIEW OWN DETAILS

    it("should allow employee to view their own details", async () => {
      req.user = {
        role: "employee",
        employeeId: "employee123",
      };

      req.params = {
        _id: "employee123",
      };

      const employee = {
        _id: "employee123",
        name: "John",
        department: {
          _id: "department123",
          name: "IT",
        },
      };

      const query = createEmployeeQuery(
        employee,
      );

      sinon
        .stub(Employee as any, "findOne")
        .returns(query as any);

      const successStub = sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getEmployeeById(req, res);

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[2]).to.deep.equal(
        employee,
      );
    });

    // 23. EMPLOYEE CANNOT VIEW ANOTHER EMPLOYEE

    it("should forbid employee from viewing another employee", async () => {
      req.user = {
        role: "employee",
        employeeId: "employee123",
      };

      req.params = {
        _id: "employee456",
      };

      const employee = {
        _id: "employee456",
        name: "Another Employee",
        department: {
          _id: "department123",
          name: "IT",
        },
      };

      const query = createEmployeeQuery(
        employee,
      );

      sinon
        .stub(Employee as any, "findOne")
        .returns(query as any);

      const forbiddenStub = sinon.stub(
        responseHelper,
        "sendForbidden",
      );

      await getEmployeeById(req, res);

      expect(forbiddenStub.calledOnce).to.equal(true);

      expect(forbiddenStub.firstCall.args[1]).to.equal(
        "You can view only your details",
      );
    });

    // 24. MANAGER SAME DEPARTMENT

    it("should allow manager to view employee in same department", async () => {
      req.user = {
        role: "manager",
        department: "department123",
      };

      req.params = {
        _id: "employee123",
      };

      const employee = {
        _id: "employee123",
        name: "John",
        department: {
          _id: "department123",
          name: "IT",
        },
      };

      const query = createEmployeeQuery(
        employee,
      );

      sinon
        .stub(Employee as any, "findOne")
        .returns(query as any);

      const successStub = sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await getEmployeeById(req, res);

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[2]).to.deep.equal(
        employee,
      );
    });

    // 25. MANAGER DIFFERENT DEPARTMENT

    it("should forbid manager from viewing employee in another department", async () => {
      req.user = {
        role: "manager",
        department: "department123",
      };

      req.params = {
        _id: "employee456",
      };

      const employee = {
        _id: "employee456",
        name: "Another Employee",
        department: {
          _id: "department999",
          name: "Salesforce",
        },
      };

      const query = createEmployeeQuery(
        employee,
      );

      sinon
        .stub(Employee as any, "findOne")
        .returns(query as any);

      const forbiddenStub = sinon.stub(
        responseHelper,
        "sendForbidden",
      );

      await getEmployeeById(req, res);

      expect(forbiddenStub.calledOnce).to.equal(true);

      expect(forbiddenStub.firstCall.args[1]).to.equal(
        "You can view only employees in your department",
      );
    });

    // 26. EMPLOYEE NOT FOUND

    it("should return not found when employee does not exist", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "employee123",
      };

      const query = createEmployeeQuery(null);

      sinon
        .stub(Employee as any, "findOne")
        .returns(query as any);

      const notFoundStub = sinon.stub(
        responseHelper,
        "sendNotFound",
      );

      await getEmployeeById(req, res);

      expect(notFoundStub.calledOnce).to.equal(true);

      expect(notFoundStub.firstCall.args[1]).to.equal(
        "Employee ID is incorrect",
      );
    });

    // 27. CAST ERROR

    it("should return not found for invalid employee ID", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "invalid-id",
      };

      const castError: any = new Error(
        "Cast error",
      );

      castError.name = "CastError";

      sinon
        .stub(Employee as any, "findOne")
        .throws(castError);

      const notFoundStub = sinon.stub(
        responseHelper,
        "sendNotFound",
      );

      await getEmployeeById(req, res);

      expect(notFoundStub.calledOnce).to.equal(true);

      expect(notFoundStub.firstCall.args[1]).to.equal(
        "Employee ID is incorrect",
      );
    });

    // 28. INTERNAL ERROR

    it("should return internal server error when getEmployeeById fails", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "employee123",
      };

      sinon
        .stub(Employee as any, "findOne")
        .throws(new Error("Database error"));

      const errorStub = sinon.stub(
        responseHelper,
        "sendInternalServerError",
      );

      await getEmployeeById(req, res);

      expect(errorStub.calledOnce).to.equal(true);

      expect(errorStub.firstCall.args[1]).to.equal(
        "Failed to fetch employee",
      );
    });
  });

  // UPDATE EMPLOYEE

  describe("updateEmployee", () => {
    // 29. SUCCESS

    it("should update employee successfully", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "employee123",
      };

      req.body = {
        name: "Updated John",
      };

      const updateStub = sinon
        .stub(Employee as any, "findByIdAndUpdate")
        .resolves({
          _id: "employee123",
          name: "Updated John",
        });

      const successStub = sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await updateEmployee(req, res);

      expect(updateStub.calledOnce).to.equal(true);

      expect(updateStub.firstCall.args[0]).to.equal(
        "employee123",
      );

      expect(updateStub.firstCall.args[1]).to.deep.equal({
        name: "Updated John",
      });

      expect(updateStub.firstCall.args[2]).to.deep.equal({
        new: true,
        runValidators: true,
      });

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[1]).to.equal(
        "Employee updated successfully",
      );
    });

    // 30. NON HR

    it("should forbid non-HR user from updating employee", async () => {
      req.user = {
        role: "manager",
      };

      const forbiddenStub = sinon.stub(
        responseHelper,
        "sendForbidden",
      );

      await updateEmployee(req, res);

      expect(forbiddenStub.calledOnce).to.equal(true);

      expect(forbiddenStub.firstCall.args[1]).to.equal(
        "Only HR is allowed to update employee details",
      );
    });

    // 31. MISSING ID

    it("should return bad request when employee ID is missing", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {};

      const badRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await updateEmployee(req, res);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "Employee ID is required",
      );
    });

    // 32. EMPLOYEE NOT FOUND

    it("should return not found when employee does not exist", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "employee123",
      };

      req.body = {
        name: "Updated John",
      };

      sinon
        .stub(Employee as any, "findByIdAndUpdate")
        .resolves(null);

      const notFoundStub = sinon.stub(
        responseHelper,
        "sendNotFound",
      );

      await updateEmployee(req, res);

      expect(notFoundStub.calledOnce).to.equal(true);

      expect(notFoundStub.firstCall.args[1]).to.equal(
        "Employee ID not found",
      );
    });

    // 33. CAST ERROR

    it("should return not found for invalid employee ID during update", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "invalid-id",
      };

      const castError: any = new Error(
        "Cast error",
      );

      castError.name = "CastError";

      sinon
        .stub(Employee as any, "findByIdAndUpdate")
        .rejects(castError);

      const notFoundStub = sinon.stub(
        responseHelper,
        "sendNotFound",
      );

      await updateEmployee(req, res);

      expect(notFoundStub.calledOnce).to.equal(true);

      expect(notFoundStub.firstCall.args[1]).to.equal(
        "Employee ID is incorrect",
      );
    });

    // 34. INTERNAL ERROR

    it("should return internal server error when update fails", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "employee123",
      };

      sinon
        .stub(Employee as any, "findByIdAndUpdate")
        .rejects(new Error("Database error"));

      const errorStub = sinon.stub(
        responseHelper,
        "sendInternalServerError",
      );

      await updateEmployee(req, res);

      expect(errorStub.calledOnce).to.equal(true);

      expect(errorStub.firstCall.args[1]).to.equal(
        "Failed to update employee",
      );
    });
  });

  // DELETE EMPLOYEE

  describe("deleteEmployee", () => {
    // 35. SUCCESS

    it("should delete employee successfully", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "employee123",
      };

      const deleteStub = sinon
        .stub(Employee as any, "findByIdAndUpdate")
        .resolves({
          _id: "employee123",
          isDeleted: true,
        });

      const successStub = sinon.stub(
        responseHelper,
        "sendSuccessResponse",
      );

      await deleteEmployee(req, res);

      expect(deleteStub.calledOnce).to.equal(true);

      expect(deleteStub.firstCall.args[0]).to.equal(
        "employee123",
      );

      expect(deleteStub.firstCall.args[1]).to.deep.equal({
        isDeleted: true,
      });

      expect(successStub.calledOnce).to.equal(true);

      expect(successStub.firstCall.args[1]).to.equal(
        "Employee deletion successful",
      );
    });

    // 36. NON HR

    it("should forbid non-HR user from deleting employee", async () => {
      req.user = {
        role: "manager",
      };

      const forbiddenStub = sinon.stub(
        responseHelper,
        "sendForbidden",
      );

      await deleteEmployee(req, res);

      expect(forbiddenStub.calledOnce).to.equal(true);

      expect(forbiddenStub.firstCall.args[1]).to.equal(
        "You are not allowed to delete employees",
      );
    });

    // 37. MISSING ID

    it("should return bad request when employee ID is missing", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {};

      const badRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await deleteEmployee(req, res);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "Employee ID is required",
      );
    });

    // 38. EMPLOYEE NOT FOUND

    it("should return bad request when employee does not exist", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "employee123",
      };

      sinon
        .stub(Employee as any, "findByIdAndUpdate")
        .resolves(null);

      const badRequestStub = sinon.stub(
        responseHelper,
        "sendBadRequest",
      );

      await deleteEmployee(req, res);

      expect(badRequestStub.calledOnce).to.equal(true);

      expect(badRequestStub.firstCall.args[1]).to.equal(
        "Employee not found",
      );
    });

    // 39. CAST ERROR

    it("should return not found for invalid employee ID during deletion", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "invalid-id",
      };

      const castError: any = new Error(
        "Cast error",
      );

      castError.name = "CastError";

      sinon
        .stub(Employee as any, "findByIdAndUpdate")
        .rejects(castError);

      const notFoundStub = sinon.stub(
        responseHelper,
        "sendNotFound",
      );

      await deleteEmployee(req, res);

      expect(notFoundStub.calledOnce).to.equal(true);

      expect(notFoundStub.firstCall.args[1]).to.equal(
        "Employee ID is incorrect",
      );
    });

    // 40. INTERNAL ERROR

    it("should return internal server error when deletion fails", async () => {
      req.user = {
        role: "hr",
      };

      req.params = {
        _id: "employee123",
      };

      sinon
        .stub(Employee as any, "findByIdAndUpdate")
        .rejects(new Error("Database error"));

      const errorStub = sinon.stub(
        responseHelper,
        "sendInternalServerError",
      );

      await deleteEmployee(req, res);

      expect(errorStub.calledOnce).to.equal(true);

      expect(errorStub.firstCall.args[1]).to.equal(
        "Failed to delete employee",
      );
    });
  });
});