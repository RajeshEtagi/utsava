/**
 * Parse a location slug in the format city-state.
 * This should render a location page even when no events exist for that slug.
 * @param {string} slug - The URL slug (e.g., "gurugram-haryana")
 * @returns {Object} - { city, state, isValid }
 */
export function parseLocationSlug(slug) {
  if (!slug || typeof slug !== "string") {
    return { city: null, state: null, isValid: false };
  }

  const parts = slug.split("-").filter(Boolean);

  // Must have at least 2 parts (city-state)
  if (parts.length < 2) {
    return { city: null, state: null, isValid: false };
  }

  const cityName = parts[0]
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const stateName = parts
    .slice(1)
    .map((part) =>
      part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");

  return { city: cityName, state: stateName, isValid: true };
}

/**
 * Create location slug from city and state
 * @param {string} city - City name
 * @param {string} state - State name
 * @returns {string} - URL slug (e.g., "gurugram-haryana")
 */
export function createLocationSlug(city, state) {
  if (!city || !state) return "";

  const citySlug = city.toLowerCase().replace(/\s+/g, "-");
  const stateSlug = state.toLowerCase().replace(/\s+/g, "-");

  return `${citySlug}-${stateSlug}`;
}
