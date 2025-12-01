/**
 * Rounds a number to two decimal places.
 * This is crucial for financial calculations to avoid floating point inaccuracies.
 * @param value The number to round.
 * @returns The rounded number.
 */
export const round = (value: number): number => {
  if (isNaN(value) || !isFinite(value)) {
    return 0;
  }
  return parseFloat(value.toFixed(2));
};
