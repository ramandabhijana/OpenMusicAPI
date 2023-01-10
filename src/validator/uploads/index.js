const InvariantError = require('../../exceptions/InvariantError');
const { ImageHeadersSchema } = require('./schema');

const UploadsValidator = {
  validateImageHeaders: (headers) => {
    const result = ImageHeadersSchema.validate(headers);
    if (result.error) {
      throw new InvariantError(result.error.message);
    }
  },
};

module.exports = UploadsValidator;
