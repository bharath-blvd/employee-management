import { expect } from "chai";
import { generateDefaultPassword } from "../utils/passwordHelper";

describe("passwordHelper", () => {
  describe("generateDefaultPassword", () => {
    it("should generate a password starting with Emp@", () => {
      const password = generateDefaultPassword();

      expect(password).to.match(/^Emp@/);
    });

    it("should generate a password with the correct length", () => {
      const password = generateDefaultPassword();

      expect(password).to.have.length(10);
    });

    it("should generate different passwords", () => {
      const password1 = generateDefaultPassword();
      const password2 = generateDefaultPassword();

      expect(password1).to.not.equal(password2);
    });

    it("should generate a password in the expected format", () => {
      const password = generateDefaultPassword();

      expect(password).to.match(/^Emp@[a-z0-9]{6}$/);
    });
  });
});