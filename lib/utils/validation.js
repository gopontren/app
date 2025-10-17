/**
 * Input Validation Utilities
 */

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  // Minimal 6 karakter
  return password && password.length >= 6;
}

export function validatePin(pin) {
  // PIN harus 6 digit angka
  return /^\d{6}$/.test(pin);
}

export function validateRequired(fields, data) {
  const missing = [];
  
  for (const field of fields) {
    if (!data[field]) {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

export function validatePhoneNumber(phone) {
  // Format Indonesia: 08xx atau +62
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone);
}
