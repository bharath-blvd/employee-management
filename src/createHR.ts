import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Employee } from "./models/employeeSchema";

const createHR = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);

    const password = "Hr@123456";

    const hashedPassword = await bcrypt.hash(password, 10);

    const hr = await Employee.create({
      name: "megha",
      email: "hr@gmail.com",
      password: hashedPassword,
      passwordResetRequired: false,

      role: "6a9032717a2d76358b080696",
      department: "6a9021dda3b0124bf2ae1352",

      reportsTo: null,

      phone: "8100000000",
      designation: "HR Manager",
      salary: 800000,
      joiningDate: new Date(),
      status: "Active",

      leaveBalance: {
        annual: 16,
        sick: 4,
      },

      isDeleted: false,
    });

    console.log("HR created successfully");
    console.log("HR ID:", hr._id);
    console.log("Email:", "hr@gmail.com");
    console.log("Password:", password);

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
};

createHR();