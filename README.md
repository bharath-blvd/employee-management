# Employee Management System

A backend Employee Management System built using **Node.js, Express, TypeScript, and MongoDB**.

The application provides employee management, role and department management, authentication and authorization, leave management, password management, and email-based employee onboarding.

---

## Features

### Authentication & Authorization

- Employee login using email and password
- Password hashing using bcrypt
- JWT-based authentication
- Role-based authorization
- Different access levels for:
  - Admin
  - HR
  - Manager
  - Employee
- Protected API routes using authentication middleware

### Employee Management

- Create employees
- View all employees
- View employee details by ID
- Update employee details
- Soft delete employees
- Search employees by:
  - Name
  - Email
  - Designation
- Filter employees by:
  - Department
  - Status
- Sort employees
- Pagination support
- Employees can view only their own details
- Managers can view employees in their department
- HR can manage employee information

### Employee Onboarding

- HR can create employees
- Temporary passwords can be generated for employees
- Passwords are hashed before storing in MongoDB
- Employee onboarding credentials can be sent through email
- Employees are required to change their temporary password after first login

### Department Management

- Create departments
- View all departments

### Role Management

- Create roles
- Prevent duplicate roles
- View all roles

### Leave Management

- Employees can apply for leave
- Supported leave types:
  - Annual
  - Sick
- Working days are calculated automatically
- Weekends are excluded while calculating working days
- Leave balance is checked before applying
- Leave balance is deducted when leave is applied
- Employees can view their own leaves
- HR can view all leaves
- Managers can view leaves of their direct reportees
- Managers can approve or reject leave requests
- Rejected leaves return the deducted leave balance
- Processed leave requests cannot be modified

### Password Management

- Employees can change their password
- Current password is verified before changing
- New passwords are hashed using bcrypt
- Temporary password requirement is removed after changing the password

### Email Service

Nodemailer is used to send onboarding emails containing temporary login credentials.

## Technologies Used

- **Node.js** – JavaScript runtime environment
- **Express.js** – Backend framework for building REST APIs
- **TypeScript** – Type-safe development
- **MongoDB** – NoSQL database
- **Mongoose** – MongoDB ODM
- **JWT** – Authentication and authorization
- **bcrypt** – Password hashing
- **Nodemailer** – Email service for employee onboarding
- **dotenv** – Environment variable management
- **Mocha** – Unit testing framework
- **Chai** – Assertion library
- **Sinon** – Stubbing and mocking
- **c8** – Code coverage reporting
