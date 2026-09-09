import { expect } from "chai";
import {
  isValidEmail,
  isValidPhone,
} from "../utils/validationHelper";

describe("validationHelper", () => {
  describe("isValidEmail", () => {
    it("should return true for a valid .com email", () => {
      expect(isValidEmail("john@gmail.com")).to.be.true;
    });

    it("should return true for a valid .in email", () => {
      expect(isValidEmail("john@gmail.in")).to.be.true;
    });

    it("should return true for an email containing numbers and dots", () => {
      expect(isValidEmail("john123.test@gmail.com")).to.be.true;
    });

    it("should return false when email does not start with a letter", () => {
      expect(isValidEmail("123john@gmail.com")).to.be.false;
    });

    it("should return false for an email with an invalid domain extension", () => {
      expect(isValidEmail("john@gmail.org")).to.be.false;
    });

    it("should return false for an email without @", () => {
      expect(isValidEmail("johngmail.com")).to.be.false;
    });

    it("should return false for an empty email", () => {
      expect(isValidEmail("")).to.be.false;
    });
  });

  describe("isValidPhone", () => {
    it("should return true for a valid phone number", () => {
      expect(isValidPhone("9876543210")).to.be.true;
    });

    it("should return true for a valid phone number with country code", () => {
      expect(isValidPhone("+919876543210")).to.be.true;
    });

    it("should return false when phone number starts with zero", () => {
      expect(isValidPhone("0987654321")).to.be.false;
    });

    it("should return false for a phone number shorter than 8 digits", () => {
      expect(isValidPhone("1234567")).to.be.false;
    });

    it("should return false for a phone number containing letters", () => {
      expect(isValidPhone("98765abc10")).to.be.false;
    });

    it("should return false for an empty phone number", () => {
      expect(isValidPhone("")).to.be.false;
    });
  });
});