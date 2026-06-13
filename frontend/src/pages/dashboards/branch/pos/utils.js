// pos/utils.js  – shared helper functions used across POS modules

export const getWalkInCustomerName = (notes) => {
  if (!notes) return "Walk-in Customer";
  const match = notes.match(/Walk-in Service:\s*([^(|]+)/i) || notes.match(/Walk-in:\s*([^(|]+)/i);
  return match ? match[1].trim() : "Walk-in Customer";
};

export const getWalkInCustomerPhone = (notes) => {
  if (!notes) return "";
  const match = notes.match(/Walk-in Service:\s*[^(|]+\(([^)]*)\)/i) || notes.match(/Walk-in:\s*[^(|]+\(([^)]*)\)/i);
  return match && match[1] ? match[1].trim() : "";
};

export const generateServiceId = (uuidStr) => {
  if (!uuidStr) return "000000";
  let hash = 0;
  for (let i = 0; i < uuidStr.length; i++) {
    hash = (hash << 5) - hash + uuidStr.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 900000 + 100000).toString();
};

export const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date)) return isoString;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ /g, '-').toUpperCase();
};

export const formatTime12Hour = (timeString) => {
  if (!timeString) return "";
  let [hours, minutes] = timeString.split(':');
  if (!hours || !minutes) return timeString;
  hours = parseInt(hours, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};
