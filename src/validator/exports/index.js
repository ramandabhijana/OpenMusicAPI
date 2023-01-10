const InvariantError = require('../../exceptions/InvariantError');
const ExportPlaylistPayloadSchema = require('./schema');

const ExportPlaylistsValidator = {
  validateExportPlaylistsPayload: (payload) => {
    const result = ExportPlaylistPayloadSchema.validate(payload);
    if (result.error) {
      throw new InvariantError(result.error.message);
    }
  },
};

module.exports = ExportPlaylistsValidator;
