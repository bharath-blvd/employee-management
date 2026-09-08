import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    name: {
      type: String,
      required: [true],
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },

    passwordResetRequired: {
      type: Boolean,
      default: true,
    },

    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null
      
    },
    phone: {
      type: String,
      required: [true],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true],
    },
    designation: {
      type: String,
      required: [true],
    },
    salary: {
      type: Number,
      required: [true],
    },
    joiningDate: {
      type: Date,
      required: [true],
    },
    status: {
      type: String,
      required: [true],
      default: "Active",
    },
    rating: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },
    leaveBalance: {
      type: {
        annual: {
          type: Number,
          default: 16,
        },
        sick: {
          type: Number,
          default: 4,
        },
      },
      default: () => ({
        annual: 16,
        sick: 4,
      }),
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
export const Employee = mongoose.model("Employee", employeeSchema);
