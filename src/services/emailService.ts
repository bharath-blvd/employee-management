import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendOnboardingEmail = async (
  employeeEmail: string,
  employeeName: string,
  temporaryPassword: string,
) => {
  await transporter.sendMail({
    from: `"HR Team" <${process.env.EMAIL_USER}>`,
    to: employeeEmail,
    subject: "Congratulations! You have been onboarded",
    html: `
      <h2>Congratulations ${employeeName}! 🎉</h2>

      <p>Welcome to our organization.</p>

      <p>Your employee account has been successfully created.</p>

      <h3>Your login credentials:</h3>

      <p><strong>Email:</strong> ${employeeEmail}</p>
      <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>

      <p>
        Please log in using these credentials and change your password
        after your first login.
      </p>

      <p>Regards,<br>HR Team</p>
    `,
  });
};