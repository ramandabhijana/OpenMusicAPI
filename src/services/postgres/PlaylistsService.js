const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistsService {
  constructor(collaborativePlaylistsService) {
    this._pool = new Pool();
    this._collaborativePlaylistsService = collaborativePlaylistsService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const result = await this._pool.query({
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    });
    const playlistId = result.rows[0]?.id;
    if (!playlistId) {
      throw new InvariantError('Gagal menambahkan Playlist');
    }
    return playlistId;
  }

  async getPlaylistsByOwner(owner) {
    const result = await this._pool.query({
      text: `SELECT p.id, p.name, u.username
      FROM playlists AS p 
      LEFT JOIN collaborative_playlists AS cp 
      ON cp.playlist_id = p.id
      LEFT JOIN users AS u
      ON u.id = p.owner
      WHERE p.owner = $1 OR cp.user_id = $1`,
      values: [owner],
    });
    return result.rows;
  }

  async deletePlaylistById(id) {
    const result = await this._pool.query({
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING ID',
      values: [id],
    });
    const playlistId = result.rows[0]?.id;
    if (!playlistId) {
      throw new NotFoundError(`Gagal menghapus playlist. Alasan: playlist dengan id=${id} tidak ditemukan`);
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const result = await this._pool.query({
      text: 'SELECT owner FROM playlists WHERE id = $1',
      values: [id],
    });
    const playlistExists = result.rowCount;
    if (!playlistExists) {
      throw new NotFoundError(`Playlist dengan Id=${id} tidak ditemukan`);
    }
    const playlistOwner = result.rows[0].owner;
    if (playlistOwner !== owner) {
      throw new AuthorizationError('Akses ke sumber daya tidak diijinkan');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) { throw error; }
      await this._collaborativePlaylistsService.verifyCollaborator(userId, playlistId);
    }
  }
}

module.exports = PlaylistsService;
