const InvariantError = require('../../exceptions/InvariantError');
const { PostPlaylistPayloadSchema, PostPlaylistSongPayloadSchema, DeletePlaylistSongPayloadSchema } = require('./schema');

const PlaylistsValidator = {
  validatePostPlaylistPayload: (payload) => {
    const result = PostPlaylistPayloadSchema.validate(payload);
    if (result.error) {
      throw new InvariantError(result.error.message);
    }
  },
  validatePostPlaylistSongPayload: (payload) => {
    const result = PostPlaylistSongPayloadSchema.validate(payload);
    if (result.error) {
      throw new InvariantError(result.error.message);
    }
  },
  validateDeletePlaylistSongPayload: (payload) => {
    const result = DeletePlaylistSongPayloadSchema.validate(payload);
    if (result.error) {
      throw new InvariantError(result.error.message);
    }
  },
};

module.exports = PlaylistsValidator;
