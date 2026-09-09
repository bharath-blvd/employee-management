import { expect } from "chai";
import {
  calculateWorkingDays,
  getAvailableLeaveBalance,
  deductLeaveBalance,
} from "../services/leaveService";

describe("leaveService", () => {
  describe("calculateWorkingDays", () => {
    it("should return the number of working days between Monday and Friday", () => {
      const fromDate = new Date("2026-09-07"); // Monday
      const toDate = new Date("2026-09-11"); // Friday

      const result = calculateWorkingDays(fromDate, toDate);

      expect(result).to.equal(5);
    });

    it("should exclude Saturday and Sunday", () => {
      const fromDate = new Date("2026-09-07"); // Monday
      const toDate = new Date("2026-09-13"); // Sunday

      const result = calculateWorkingDays(fromDate, toDate);

      expect(result).to.equal(5);
    });

    it("should return 0 when the date range contains only a weekend", () => {
      const fromDate = new Date("2026-09-12"); // Saturday
      const toDate = new Date("2026-09-13"); // Sunday

      const result = calculateWorkingDays(fromDate, toDate);

      expect(result).to.equal(0);
    });

    it("should return 1 when fromDate and toDate are the same working day", () => {
      const fromDate = new Date("2026-09-07"); // Monday
      const toDate = new Date("2026-09-07"); // Monday

      const result = calculateWorkingDays(fromDate, toDate);

      expect(result).to.equal(1);
    });

    it("should return 0 when fromDate is after toDate", () => {
      const fromDate = new Date("2026-09-11");
      const toDate = new Date("2026-09-07");

      const result = calculateWorkingDays(fromDate, toDate);

      expect(result).to.equal(0);
    });
  });

  describe("getAvailableLeaveBalance", () => {
    const employee = {
      leaveBalance: {
        annual: 16,
        sick: 4,
      },
    };

    it("should return annual leave balance", () => {
      const result = getAvailableLeaveBalance(employee, "annual");

      expect(result).to.equal(16);
    });

    it("should return sick leave balance", () => {
      const result = getAvailableLeaveBalance(employee, "sick");

      expect(result).to.equal(4);
    });

    it("should throw an error for an invalid leave type", () => {
      expect(() =>
        getAvailableLeaveBalance(employee, "casual"),
      ).to.throw("Invalid leave type");
    });
  });

  describe("deductLeaveBalance", () => {
    it("should deduct working days from annual leave balance", () => {
      const employee = {
        leaveBalance: {
          annual: 16,
          sick: 4,
        },
      };

      deductLeaveBalance(employee, "annual", 3);

      expect(employee.leaveBalance.annual).to.equal(13);
      expect(employee.leaveBalance.sick).to.equal(4);
    });

    it("should deduct working days from sick leave balance", () => {
      const employee = {
        leaveBalance: {
          annual: 16,
          sick: 4,
        },
      };

      deductLeaveBalance(employee, "sick", 2);

      expect(employee.leaveBalance.sick).to.equal(2);
      expect(employee.leaveBalance.annual).to.equal(16);
    });

    it("should throw an error for an invalid leave type", () => {
      const employee = {
        leaveBalance: {
          annual: 16,
          sick: 4,
        },
      };

      expect(() =>
        deductLeaveBalance(employee, "casual", 2),
      ).to.throw("Invalid leave type");
    });
  });
});