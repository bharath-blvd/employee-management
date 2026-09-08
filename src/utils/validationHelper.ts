export const emailRegex = /^[A-Za-z][A-Za-z0-9.]*@[A-Za-z]+\.(com|in)$/;
export const phoneRegex = /^\+?[1-9]\d{7,14}$/;

export function isValidEmail(email: string): boolean {
    return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
    return phoneRegex.test(phone);
}