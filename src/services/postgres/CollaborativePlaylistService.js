const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class CollaborativePlaylistService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addCollaborator(collaboratorId, playlistId) {
    const id = `collab_playlist-${nanoid(16)}`;
    const result = await this._pool.query({
      text: 'INSERT INTO collaborative_playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, collaboratorId],
    });
    const isCollabPlaylistAdded = result.rows[0]?.id === id;
    if (!isCollabPlaylistAdded) {
      throw new InvariantError('Gagal membuat collaborative playlist');
    }
    await this._cacheService.delete(`playlists:${collaboratorId}`);
    return id;
  }

  async deleteCollaborator(collaboratorId, playlistId) {
    const result = await this._pool.query({
      text: 'DELETE FROM collaborative_playlists WHERE playlist_id = $1 AND user_id = $2 RETURNING id',
      values: [playlistId, collaboratorId],
    });
    const id = result.rows[0]?.id;
    if (!id) {
      throw new NotFoundError('Gagal menghapus collaborative playlist. Alasan: data tidak ditemukan');
    }
    await this._cacheService.delete(`playlists:${collaboratorId}`);
  }

  async verifyCollaborator(collaboratorId, playlistId) {
    const result = await this._pool.query({
      text: 'SELECT id FROM collaborative_playlists WHERE playlist_id = $1 AND user_id = $2',
      values: [playlistId, collaboratorId],
    });
    const id = result.rows[0]?.id;
    if (!id) {
      throw new AuthorizationError('Tidak dapat memverifikasi collaborative playlist');
    }
  }
}

module.exports = CollaborativePlaylistService;
