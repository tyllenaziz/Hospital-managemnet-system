export const formatDisplayNumber = (
  value,
  { maximumFractionDigits = 2, minimumFractionDigits = 0 } = {}
) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const parsedValue =
    typeof value === 'number' ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(parsedValue)) {
    return String(value);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(parsedValue);
};

export const normalizeNumericInputValue = (
  value,
  { maximumFractionDigits = 2 } = {}
) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return formatDisplayNumber(value, { maximumFractionDigits });
};
