/**
 * Formats a Date object to a string suitable for HTML5 datetime-local input (YYYY-MM-DDTHH:mm).
 * It uses the local time components of the Date object.
 */
export const toDateTimeLocal = (date: Date): string => {
  if (isNaN(date.getTime())) {
    date = new Date();
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Parses a datetime-local input string and returns an ISO 8601 UTC string
 * suitable for the backend.
 */
export const toUTCISOString = (localDateTime: string): string => {
  if (!localDateTime) return new Date().toISOString();
  // new Date("YYYY-MM-DDTHH:mm") parses as local time in most browsers
  const date = new Date(localDateTime);
  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};
