export const formatDate = (
  inputDate,
  locale = "en-BD",
  options = {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }
) => {
  if (!inputDate) {
    return "-";
  }

  const date = inputDate instanceof Date ? inputDate : new Date(inputDate);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
};
