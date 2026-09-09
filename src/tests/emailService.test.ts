import { expect } from "chai";
import sinon from "sinon";
import { transporter, sendOnboardingEmail } from "../services/emailService";

describe("emailService", () => {
  let sendMailStub: sinon.SinonStub;

  beforeEach(() => {
    sendMailStub = sinon.stub(transporter, "sendMail");
    sendMailStub.resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("sendOnboardingEmail", () => {
    it("should send onboarding email with employee details", async () => {
      await sendOnboardingEmail(
        "employee@gmail.com",
        "John",
        "Temp@123",
      );

      expect(sendMailStub.calledOnce).to.be.true;

      const mailOptions = sendMailStub.firstCall.args[0];

      expect(mailOptions.to).to.equal("employee@gmail.com");

      expect(mailOptions.subject).to.equal(
        "Congratulations! You have been onboarded",
      );

      expect(mailOptions.html).to.include("Congratulations John!");
      expect(mailOptions.html).to.include("employee@gmail.com");
      expect(mailOptions.html).to.include("Temp@123");
      expect(mailOptions.html).to.include(
        "Please log in using these credentials",
      );
    });

    it("should use the employee email as the recipient", async () => {
      await sendOnboardingEmail(
        "test@gmail.com",
        "Test Employee",
        "Password@123",
      );

      const mailOptions = sendMailStub.firstCall.args[0];

      expect(mailOptions.to).to.equal("test@gmail.com");
    });

    it("should include the temporary password in the email", async () => {
      await sendOnboardingEmail(
        "test@gmail.com",
        "Test Employee",
        "Temporary@456",
      );

      const mailOptions = sendMailStub.firstCall.args[0];

      expect(mailOptions.html).to.include("Temporary@456");
    });

    it("should throw an error when sending email fails", async () => {
      sendMailStub.rejects(new Error("Email sending failed"));

      try {
        await sendOnboardingEmail(
          "employee@gmail.com",
          "John",
          "Temp@123",
        );

        expect.fail("Expected sendOnboardingEmail to throw an error");
      } catch (error: any) {
        expect(error.message).to.equal("Email sending failed");
      }
    });
  });
});