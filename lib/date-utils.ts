function normalizeDateValue(value: string | null | undefined) {
  return (value ?? "").trim();
}

export function parseValidIsoDate(value: string | null | undefined) {
  const normalizedValue = normalizeDateValue(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return null;
  }

  const [year, month, day] = normalizedValue.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

export function isValidIsoDate(value: string | null | undefined) {
  return parseValidIsoDate(value) !== null;
}
