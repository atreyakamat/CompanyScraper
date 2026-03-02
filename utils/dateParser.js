/**
 * Parses relative date strings (e.g., "4 days ago", "1 week ago", "2 months ago") 
 * into an ISO date string (YYYY-MM-DD).
 */
function parseRelativeDate(relativeStr) {
  if (!relativeStr || relativeStr === 'N/A') return 'N/A';
  
  const now = new Date();
  const lowerStr = relativeStr.toLowerCase();
  
  const match = lowerStr.match(/(\d+)\s+(day|week|month|year)s?\s+ago/);
  if (!match) return relativeStr; // Return original if it doesn't match pattern

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'day':
      now.setDate(now.getDate() - value);
      break;
    case 'week':
      now.setDate(now.getDate() - (value * 7));
      break;
    case 'month':
      now.setMonth(now.getMonth() - value);
      break;
    case 'year':
      now.setFullYear(now.getFullYear() - value);
      break;
  }

  return now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

module.exports = { parseRelativeDate };
