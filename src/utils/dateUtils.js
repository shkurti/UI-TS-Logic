/**
 * Format a date string into a more readable format
 * @param {string} dateString - The ISO date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate time remaining and percentage complete for a shipment
 * @param {string} departureTime - ISO date string of departure time
 * @param {string} estimatedArrival - ISO date string of estimated arrival
 * @returns {Object} Object containing timeRemaining and percentComplete
 */
export const calculateTimeRemaining = (departureTime, estimatedArrival) => {
  const now = new Date().getTime();
  const departure = new Date(departureTime).getTime();
  const arrival = new Date(estimatedArrival).getTime();
  
  // Check for valid dates
  if (isNaN(departure) || isNaN(arrival)) {
    return { timeRemaining: 0, percentComplete: 0 };
  }
  
  const totalDuration = arrival - departure;
  if (totalDuration <= 0) {
    return { timeRemaining: 0, percentComplete: 0 };
  }
  
  const elapsed = now - departure;
  
  // Calculate time remaining in hours
  const remainingMs = arrival - now;
  const timeRemaining = Math.max(0, Math.round(remainingMs / (1000 * 60 * 60)));
  
  // Calculate percentage complete
  let percentComplete = Math.round((elapsed / totalDuration) * 100);
  
  // Cap percentage between 0 and 100
  percentComplete = Math.min(100, Math.max(0, percentComplete));
  
  return { timeRemaining, percentComplete };
};
