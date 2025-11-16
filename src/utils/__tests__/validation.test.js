const validators = require('../validation');
const { ValidationError } = require('../errors');

describe('Validation Utilities', () => {
  describe('requirePositiveInteger', () => {
    it('should accept positive integers', () => {
      expect(validators.requirePositiveInteger(5, 'test')).toBe(5);
      expect(validators.requirePositiveInteger(100, 'test')).toBe(100);
      expect(validators.requirePositiveInteger(1, 'test')).toBe(1);
    });

    it('should convert numeric strings to integers', () => {
      expect(validators.requirePositiveInteger('10', 'test')).toBe(10);
      expect(validators.requirePositiveInteger('999', 'test')).toBe(999);
    });

    it('should reject null and undefined', () => {
      expect(() => validators.requirePositiveInteger(null, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requirePositiveInteger(null, 'test')).toThrow(
        'test is required'
      );
      expect(() => validators.requirePositiveInteger(undefined, 'test')).toThrow(
        ValidationError
      );
    });

    it('should reject zero', () => {
      expect(() => validators.requirePositiveInteger(0, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requirePositiveInteger(0, 'test')).toThrow(
        'must be a positive integer'
      );
    });

    it('should reject negative numbers', () => {
      expect(() => validators.requirePositiveInteger(-1, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requirePositiveInteger(-100, 'test')).toThrow(
        ValidationError
      );
    });

    it('should reject decimal numbers', () => {
      expect(() => validators.requirePositiveInteger(5.5, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requirePositiveInteger(1.1, 'test')).toThrow(
        ValidationError
      );
    });

    it('should reject non-numeric strings', () => {
      expect(() => validators.requirePositiveInteger('abc', 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requirePositiveInteger('', 'test')).toThrow(
        ValidationError
      );
    });
  });

  describe('requireNonNegativeInteger', () => {
    it('should accept zero and positive integers', () => {
      expect(validators.requireNonNegativeInteger(0, 'test')).toBe(0);
      expect(validators.requireNonNegativeInteger(5, 'test')).toBe(5);
      expect(validators.requireNonNegativeInteger(100, 'test')).toBe(100);
    });

    it('should convert numeric strings to integers', () => {
      expect(validators.requireNonNegativeInteger('0', 'test')).toBe(0);
      expect(validators.requireNonNegativeInteger('42', 'test')).toBe(42);
    });

    it('should reject null and undefined', () => {
      expect(() => validators.requireNonNegativeInteger(null, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonNegativeInteger(undefined, 'test')).toThrow(
        ValidationError
      );
    });

    it('should reject negative numbers', () => {
      expect(() => validators.requireNonNegativeInteger(-1, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonNegativeInteger(-100, 'test')).toThrow(
        ValidationError
      );
    });

    it('should reject decimal numbers', () => {
      expect(() => validators.requireNonNegativeInteger(0.5, 'test')).toThrow(
        ValidationError
      );
    });
  });

  describe('requireNonEmptyString', () => {
    it('should accept non-empty strings', () => {
      expect(validators.requireNonEmptyString('hello', 'test')).toBe('hello');
      expect(validators.requireNonEmptyString('test', 'test')).toBe('test');
    });

    it('should trim whitespace from strings', () => {
      expect(validators.requireNonEmptyString('  hello  ', 'test')).toBe('hello');
      expect(validators.requireNonEmptyString('\ttest\t', 'test')).toBe('test');
      expect(validators.requireNonEmptyString('\nvalue\n', 'test')).toBe('value');
    });

    it('should reject empty strings', () => {
      expect(() => validators.requireNonEmptyString('', 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonEmptyString('', 'test')).toThrow(
        'test is required and cannot be empty'
      );
    });

    it('should reject whitespace-only strings', () => {
      expect(() => validators.requireNonEmptyString('   ', 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonEmptyString('\t\t', 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonEmptyString('\n\n', 'test')).toThrow(
        ValidationError
      );
    });

    it('should reject null and undefined', () => {
      expect(() => validators.requireNonEmptyString(null, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonEmptyString(undefined, 'test')).toThrow(
        ValidationError
      );
    });

    it('should reject non-string types', () => {
      expect(() => validators.requireNonEmptyString(123, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonEmptyString(true, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonEmptyString({}, 'test')).toThrow(
        ValidationError
      );
    });
  });

  describe('requireNonEmptyArray', () => {
    it('should accept non-empty arrays', () => {
      expect(validators.requireNonEmptyArray([1, 2, 3], 'test')).toEqual([1, 2, 3]);
      expect(validators.requireNonEmptyArray(['a', 'b'], 'test')).toEqual(['a', 'b']);
    });

    it('should reject empty arrays', () => {
      expect(() => validators.requireNonEmptyArray([], 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonEmptyArray([], 'test')).toThrow(
        'test cannot be empty'
      );
    });

    it('should reject null and undefined', () => {
      expect(() => validators.requireNonEmptyArray(null, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonEmptyArray(undefined, 'test')).toThrow(
        ValidationError
      );
    });

    it('should reject non-array types', () => {
      expect(() => validators.requireNonEmptyArray('not-array', 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonEmptyArray(123, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireNonEmptyArray({}, 'test')).toThrow(
        ValidationError
      );
    });
  });

  describe('requireObject', () => {
    it('should accept valid objects', () => {
      const obj = { key: 'value' };
      expect(validators.requireObject(obj, 'test')).toEqual(obj);
      expect(validators.requireObject({ a: 1 }, 'test')).toEqual({ a: 1 });
    });

    it('should reject null', () => {
      expect(() => validators.requireObject(null, 'test')).toThrow(ValidationError);
    });

    it('should reject undefined', () => {
      expect(() => validators.requireObject(undefined, 'test')).toThrow(
        ValidationError
      );
    });

    it('should reject arrays', () => {
      expect(() => validators.requireObject([], 'test')).toThrow(ValidationError);
      expect(() => validators.requireObject([1, 2, 3], 'test')).toThrow(
        ValidationError
      );
    });

    it('should reject primitives', () => {
      expect(() => validators.requireObject('string', 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireObject(123, 'test')).toThrow(ValidationError);
      expect(() => validators.requireObject(true, 'test')).toThrow(ValidationError);
    });
  });

  describe('requireInRange', () => {
    it('should accept values within range', () => {
      expect(validators.requireInRange(5, 0, 10, 'test')).toBe(5);
      expect(validators.requireInRange(0, 0, 10, 'test')).toBe(0);
      expect(validators.requireInRange(10, 0, 10, 'test')).toBe(10);
    });

    it('should convert numeric strings', () => {
      expect(validators.requireInRange('5', 0, 10, 'test')).toBe(5);
    });

    it('should reject values below minimum', () => {
      expect(() => validators.requireInRange(-1, 0, 10, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireInRange(-1, 0, 10, 'test')).toThrow(
        'must be between 0 and 10'
      );
    });

    it('should reject values above maximum', () => {
      expect(() => validators.requireInRange(11, 0, 10, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireInRange(100, 0, 10, 'test')).toThrow(
        ValidationError
      );
    });

    it('should reject non-numeric values', () => {
      expect(() => validators.requireInRange('abc', 0, 10, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireInRange(undefined, 0, 10, 'test')).toThrow(
        ValidationError
      );
      expect(() => validators.requireInRange(NaN, 0, 10, 'test')).toThrow(
        ValidationError
      );
    });
  });

  describe('requireExists', () => {
    it('should accept any truthy value', () => {
      expect(validators.requireExists(1, 'test')).toBe(1);
      expect(validators.requireExists('hello', 'test')).toBe('hello');
      expect(validators.requireExists(true, 'test')).toBe(true);
      expect(validators.requireExists({}, 'test')).toEqual({});
      expect(validators.requireExists([], 'test')).toEqual([]);
    });

    it('should accept zero and false', () => {
      expect(validators.requireExists(0, 'test')).toBe(0);
      expect(validators.requireExists(false, 'test')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(() => validators.requireExists(null, 'test')).toThrow(ValidationError);
      expect(() => validators.requireExists(undefined, 'test')).toThrow(
        ValidationError
      );
    });
  });

  describe('assert', () => {
    it('should pass for truthy values', () => {
      expect(() => validators.assert(true, 'message')).not.toThrow();
      expect(() => validators.assert(1, 'message')).not.toThrow();
      expect(() => validators.assert('value', 'message')).not.toThrow();
    });

    it('should throw ValidationError with custom message for falsy values', () => {
      expect(() => validators.assert(false, 'custom error')).toThrow(
        ValidationError
      );
      expect(() => validators.assert(false, 'custom error')).toThrow('custom error');
      expect(() => validators.assert(0, 'zero error')).toThrow('zero error');
      expect(() => validators.assert(null, 'null error')).toThrow('null error');
      expect(() => validators.assert(undefined, 'undefined error')).toThrow(
        'undefined error'
      );
    });
  });
});
