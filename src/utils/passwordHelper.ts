export const generateDefaultPassword = (): string => {
  const random = Math.random().toString(36).slice(-6);

  return `Emp@${random}`;
};