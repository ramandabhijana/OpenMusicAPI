const autoBind = require('auto-bind');

class PlaylistHandler {
  constructor(
    playlistsService,
    playlistSongsService,
    playlistActivitiesService,
    songsService,
    validator,
  ) {
    this._playlistsService = playlistsService;
    this._playlistSongsService = playlistSongsService;
    this._playlistActivitiesService = playlistActivitiesService;
    this._songsService = songsService;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePostPlaylistPayload(request.payload);
    const { name } = request.payload;
    const { credentialId: owner } = request.auth.credentials;
    const playlistId = await this._playlistsService.addPlaylist({ name, owner });
    return h.response({
      status: 'success',
      data: { playlistId },
    }).code(201);
  }

  async postPlaylistSongByPlaylistIdHandler(request, h) {
    this._validator.validatePostPlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { title } = await this._songsService.getSongById(songId);
    const { id: playlistId } = request.params;
    const { credentialId, username } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    await this._playlistSongsService.addToPlaylist(playlistId, { songId, title }, username);
    return h.response({
      status: 'success',
      message: 'Berhasil menambahkan lagu ke playlist',
    }).code(201);
  }

  async getPlaylistsHandler(request) {
    const { credentialId: owner } = request.auth.credentials;
    const playlists = await this._playlistsService.getPlaylistsByOwner(owner);
    return {
      status: 'success',
      data: { playlists },
    };
  }

  async getPlaylistSongsByPlaylistIdHandler(request) {
    const { credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;
    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    const playlist = await this._playlistSongsService.getPlaylistSongsById(playlistId);
    return {
      status: 'success',
      data: { playlist },
    };
  }

  async deletePlaylistByIdHandler(request) {
    const { id } = request.params;
    const { credentialId } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistOwner(id, credentialId);
    await this._playlistsService.deletePlaylistById(id);
    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async deletePlaylistSongByPlaylistIdHandler(request) {
    this._validator.validateDeletePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { title } = await this._songsService.getSongById(songId);
    const { id: playlistId } = request.params;
    const { credentialId, username } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    await this._playlistSongsService.deleteFromPlaylist(playlistId, { songId, title }, username);
    return {
      status: 'success',
      message: 'Berhasil menghapus lagu dari playlist',
    };
  }

  async getPlaylistActivitiesByPlaylistIdHandler(request) {
    const { id: playlistId } = request.params;
    const { credentialId } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    const activities = await this._playlistActivitiesService
      .getActivitiesByPlaylistId(playlistId, credentialId);
    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

module.exports = PlaylistHandler;
