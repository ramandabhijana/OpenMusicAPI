const autoBind = require('auto-bind');

class CollaborativePlaylistHandler {
  constructor(collabPlaylistsService, playlistsService, usersService, validator) {
    this._collabPlaylistsService = collabPlaylistsService;
    this._playlistsService = playlistsService;
    this._usersService = usersService;
    this._validator = validator;

    autoBind(this);
  }

  async postCollaborationHandler(request, h) {
    this._validator.validateCollaborativePlaylistPayload(request.payload);
    const { playlistId, userId } = request.payload;
    const { credentialId } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    const { id: collaboratorId } = await this._usersService.getUserById(userId);
    const collaborationId = await this._collabPlaylistsService
      .addCollaborator(collaboratorId, playlistId);
    return h.response({
      status: 'success',
      data: { collaborationId },
    }).code(201);
  }

  async deleteCollaborationHandler(request) {
    this._validator.validateCollaborativePlaylistPayload(request.payload);
    const { playlistId, userId } = request.payload;
    const { credentialId } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    const { id: collaboratorId } = await this._usersService.getUserById(userId);
    await this._collabPlaylistsService.deleteCollaborator(collaboratorId, playlistId);
    return {
      status: 'success',
      message: 'Berhasil menghapus collaborative playlist',
    };
  }
}

module.exports = CollaborativePlaylistHandler;
