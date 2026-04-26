export const APP_TIME_ZONE = "Asia/Dhaka";

const pad = (value) => String(value).padStart(2, "0");

const getParts = (value, timeZone = APP_TIME_ZONE) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
};

export const toDateKeyInZone = (value, timeZone = APP_TIME_ZONE) => {
  const parts = getParts(value, timeZone);

  if (!parts) {
    return "";
  }

  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const toMonthKeyInZone = (value, timeZone = APP_TIME_ZONE) => {
  const parts = getParts(value, timeZone);

  if (!parts) {
    return "";
  }

  return `${parts.year}-${parts.month}`;
};

export const toDateInputInZone = (value, timeZone = APP_TIME_ZONE) =>
  toDateKeyInZone(value, timeZone);

export const parseDateKeyToLocalDate = (dateKey) => {
  const [yearRaw, monthRaw, dayRaw] = String(dateKey || "").split("-");
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);
  const day = Number.parseInt(dayRaw, 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
};

export const formatTimeInZone = (
  value,
  locale = "en-BD",
  options = { hour: "2-digit", minute: "2-digit" },
  timeZone = APP_TIME_ZONE
) => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone
  }).format(date);
};
