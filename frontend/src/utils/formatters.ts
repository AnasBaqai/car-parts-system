/**
 * Formats a number as currency in British Pounds (£)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
};

/**
 * Formats a number with commas for thousands
 * @param value - The number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-GB").format(value);
};

/**
 * Formats a percentage value
 * @param value - The decimal value (e.g., 0.25 for 25%)
 * @returns Formatted percentage string
 */
export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat("en-GB", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};
