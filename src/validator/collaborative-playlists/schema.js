const Joi = require('joi');

const CollaborativePlaylistPayloadSchema = Joi.object({
  playlistId: Joi.string().required(),
  userId: Joi.string().required(),
});

module.exports = { CollaborativePlaylistPayloadSchema };
