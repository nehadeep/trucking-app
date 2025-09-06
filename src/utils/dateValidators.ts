// src/utils/dateValidators.ts

/**
 * Ensures the given date is today or a past date.
 * Used for last maintenance and last inspection.
 */
export const isPastOrToday = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize
    const inputDate = new Date(dateStr);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate <= today;
};

/**
 * Ensures the given date is today or a future date.
 * Used for insurance expiry.
 */
export const isFutureOrToday = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(dateStr);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate >= today;
};
