// 📱 Format phone number as (XXX) XXX-XXXX
export const formatPhoneNumber = (value: string): string => {
    if (!value) return "";
    const cleaned = value.replace(/\D/g, ""); // remove non-digits
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return value;
    let result = "";
    if (match[1]) result = `(${match[1]}`;
    if (match[1] && match[1].length === 3) result += ") ";
    if (match[2]) result += match[2];
    if (match[2] && match[2].length === 3) result += "-";
    if (match[3]) result += match[3];
    return result;
};

// 📧 Email validation
export const isValidEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

// 🔑 License number validation: only uppercase alphanumeric
export const isValidLicenseNumber = (value: string): boolean => {
    return /^[A-Z0-9]+$/.test(value);
};

export const isValidSSN = (value: string): boolean => {
    return /^\d{3}-\d{2}-\d{4}$/.test(value);
};

export const formatSSN = (value: string): string => {
    // remove non-digits
    const digits = value.replace(/\D/g, "");
    // format: ###-##-####
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
};
