/**
 * Validates if a string is a valid URL
 * @param url - The URL string to validate
 * @returns true if valid, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch (error) {
    // Invalid URL format, return false silently as this is expected behavior
    return false;
  }
};
