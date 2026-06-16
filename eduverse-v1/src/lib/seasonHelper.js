/**
 * Determines the season based on a date
 * Feb-Apr: Spring, May-Jul: Summer, Aug-Sep: Fall, Oct-Jan: Winter
 */
export function getSeasonFromDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 9) return 'Fall';
  return 'Winter'; // Oct-Jan
}

/**
 * Generates a display name for a cohort
 */
export function getCohortDisplayName(season, year) {
  return `${season} ${year}`;
}