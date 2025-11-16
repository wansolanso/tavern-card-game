/**
 * Input Validation Utilities
 *
 * Defensive programming helpers to prevent null/undefined errors
 * and ensure data integrity throughout the application.
 */

const { ValidationError } = require('./errors');

/**
 * Validation Helper Functions
 */
const validators = {
  /**
   * Validate that a value is a positive integer
   * @param {*} value - Value to validate
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  requirePositiveInteger(value, fieldName) {
    if (value === null || value === undefined) {
      throw new ValidationError(`${fieldName} is required`);
    }

    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new ValidationError(`${fieldName} must be a positive integer, got: ${value}`);
    }

    return num;
  },

  /**
   * Validate that a value is a non-negative integer
   * @param {*} value - Value to validate
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  requireNonNegativeInteger(value, fieldName) {
    if (value === null || value === undefined) {
      throw new ValidationError(`${fieldName} is required`);
    }

    const num = Number(value);
    if (!Number.isInteger(num) || num < 0) {
      throw new ValidationError(`${fieldName} must be a non-negative integer, got: ${value}`);
    }

    return num;
  },

  /**
   * Validate that a value is a non-empty string
   * @param {*} value - Value to validate
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  requireNonEmptyString(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required and cannot be empty`);
    }

    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string, got: ${typeof value}`);
    }

    if (value.trim() === '') {
      throw new ValidationError(`${fieldName} cannot be whitespace only`);
    }

    return value.trim();
  },

  /**
   * Validate that a value is a non-empty array
   * @param {*} value - Value to validate
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  requireNonEmptyArray(value, fieldName) {
    if (value === null || value === undefined) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array, got: ${typeof value}`);
    }

    if (value.length === 0) {
      throw new ValidationError(`${fieldName} cannot be empty`);
    }

    return value;
  },

  /**
   * Validate that a value is a valid object (not null, not array)
   * @param {*} value - Value to validate
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  requireObject(value, fieldName) {
    if (value === null || value === undefined) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an object, got: ${typeof value}`);
    }

    return value;
  },

  /**
   * Validate that a number is within a range
   * @param {number} value - Value to validate
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  requireInRange(value, min, max, fieldName) {
    const num = Number(value);

    if (isNaN(num)) {
      throw new ValidationError(`${fieldName} must be a number, got: ${value}`);
    }

    if (num < min || num > max) {
      throw new ValidationError(`${fieldName} must be between ${min} and ${max}, got: ${num}`);
    }

    return num;
  },

  /**
   * Validate that a value exists (not null/undefined)
   * @param {*} value - Value to validate
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  requireExists(value, fieldName) {
    if (value === null || value === undefined) {
      throw new ValidationError(`${fieldName} is required`);
    }

    return value;
  },

  /**
   * Validate that a boolean is true
   * @param {*} value - Value to validate
   * @param {string} message - Error message if false
   * @throws {ValidationError} If validation fails
   */
  assert(value, message) {
    if (!value) {
      throw new ValidationError(message);
    }
  }
};

module.exports = validators;
