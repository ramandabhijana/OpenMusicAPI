const InvariantError = require('../../exceptions/InvariantError');
const { CollaborativePlaylistPayloadSchema } = require('./schema');

const CollaborativePlaylistsValidator = {
  validateCollaborativePlaylistPayload: (payload) => {
    const result = CollaborativePlaylistPayloadSchema.validate(payload);
    if (result.error) {
      throw new InvariantError(result.error.message);
    }
  },
};

module.exports = CollaborativePlaylistsValidator;
