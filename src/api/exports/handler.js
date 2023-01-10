const autoBind = require('auto-bind');

class ExportsHandler {
  constructor(producerService, playlistsService, validator) {
    this._producerService = producerService;
    this._playlistsService = playlistsService;
    this._validator = validator;

    autoBind(this);
  }

  async postExportPlaylistByIdHandler(request, h) {
    const { playlistId } = request.params;
    const { credentialId } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    this._validator.validateExportPlaylistsPayload(request.payload);
    const { targetEmail } = request.payload;
    const queue = 'export:playlist';
    const message = JSON.stringify({
      targetEmail,
      playlistId,
    });
    await this._producerService.sendMessage(queue, message);
    return h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    }).code(201);
  }
}

module.exports = ExportsHandler;
