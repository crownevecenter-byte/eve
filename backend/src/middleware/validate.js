// backend/src/middleware/validate.js
const logger = require('../config/logger');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (e) {
    logger.error('Validation Error Details:', e);
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: e.errors || e.message 
    });
  }
};

module.exports = validate;
