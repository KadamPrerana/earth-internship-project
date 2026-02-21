/* ============================================================
   validators.js — Shared Validation Utility Functions
   ============================================================
   Extracted from LoginPage.js for reuse across components.
   
   Functions:
     - isValidEmail(email) → boolean
     - getPasswordStrength(password) → object with rule statuses
     - isValidPassword(password) → boolean
   ============================================================ */


/**
 * Check if email is valid format (e.g., user@domain.com).
 *
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};


/**
 * Check individual password rules.
 * Returns an object with each rule's pass/fail status.
 *
 * @param {string} password - Password to check
 * @returns {object} { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial }
 */
export const getPasswordStrength = (password) => ({
    minLength: password.length >= 8,                     // At least 8 characters
    hasUppercase: /[A-Z]/.test(password),                // At least one uppercase
    hasLowercase: /[a-z]/.test(password),                // At least one lowercase
    hasNumber: /[0-9]/.test(password),                   // At least one digit
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),  // At least one special char
});


/**
 * Check if ALL password rules pass.
 *
 * @param {string} password - Password to validate
 * @returns {boolean} True if all rules pass
 */
export const isValidPassword = (password) => {
    const strength = getPasswordStrength(password);
    return Object.values(strength).every(Boolean);
};
