const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapRowsToModel } = require('../../mapper/playlists');

class PlaylistSongsService {
  constructor(playlistActivitiesService) {
    this._pool = new Pool();
    this._playlistActivitiesService = playlistActivitiesService;
  }

  async addToPlaylist(playlistId, songId, username) {
    const id = `playlist_songs-${nanoid(16)}`;
    const result = await this._pool.query({
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    });
    const isPlaylistSongAdded = result.rows[0]?.id === id;
    if (!isPlaylistSongAdded) {
      throw new InvariantError('Gagal menambahkan lagu ke playlist');
    }
    await this._playlistActivitiesService.addActivity(playlistId, { songId, username, action: 'add' });
  }

  async getPlaylistSongsById(playlistId) {
    const result = await this._pool.query({
      text: `SELECT p.id AS playlist_id, p.name, u.username, s.id, s.title, s.performer FROM playlist_songs AS ps
      LEFT JOIN songs AS s
      ON s.id = ps.song_id
      LEFT JOIN playlists AS p
      ON p.id = ps.playlist_id
      LEFT JOIN users AS u
      ON u.id = p.owner
      WHERE p.id = $1`,
      values: [playlistId],
    });
    const rowsAreEmpty = !result.rowCount;
    if (rowsAreEmpty) {
      throw new NotFoundError(`Playlist dengan id=${playlistId} tidak ditemukan`);
    }
    return mapRowsToModel(result.rows);
  }

  async deleteFromPlaylist(playlistId, songId, username) {
    const result = await this._pool.query({
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    });
    const id = result.rows[0]?.id;
    if (!id) {
      throw new NotFoundError('Gagal menghapus lagu dari playlist. Alasan: data tidak ditemukan');
    }
    await this._playlistActivitiesService.addActivity(playlistId, { songId, username, action: 'delete' });
  }
}

module.exports = PlaylistSongsService;
