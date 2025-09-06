export const formatLbs = (value: number | string): string => {
    if (!value) return "";
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return `${num.toLocaleString()}`;
};
