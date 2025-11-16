const { z } = require('zod');
const { ValidationError } = require('../utils/errors');

function validate(schema) {
  return async (req, res, next) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return next(new ValidationError('Validation failed', errors));
      }

      next(error);
    }
  };
}

module.exports = { validate };
