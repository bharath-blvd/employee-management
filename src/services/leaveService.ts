// we are calculating number of working days between two dates
export const calculateWorkingDays = (fromDate: Date,toDate: Date): number => {
    let days = 0;
    const currentDate = new Date(fromDate);
    const endDate = new Date(toDate)

    while (currentDate <= endDate) {
        const day = currentDate.getDay();

        // 0 = Sunday, 6 = Saturday
        if (day !== 0 && day !== 6) {
            days++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
};

// to get availabale leaves
export const getAvailableLeaveBalance = (
  employee: any,
  leaveType: string,
): number => {
  if (leaveType === "annual") {
    return employee.leaveBalance.annual;
  }

  if (leaveType === "sick") {
    return employee.leaveBalance.sick;
  }

  throw new Error("Invalid leave type");
};

// deducting leave balance
export const deductLeaveBalance = (
  employee: any,
  leaveType: string,
  workingDays: number,
): void => {
  if (leaveType === "annual") {
    employee.leaveBalance.annual -= workingDays;
  } else if (leaveType === "sick") {
    employee.leaveBalance.sick -= workingDays;
  } else {
    throw new Error("Invalid leave type");
  }
};