const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

class PlaylistActivitiesService {
  constructor(playlistsService) {
    this._pool = new Pool();
    this._playlistsService = playlistsService;
  }

  async addActivity(playlistId, { title, username, action }) {
    const id = `playlist_activities-${nanoid(16)}`;
    const time = new Date();
    const result = await this._pool.query({
      text: 'INSERT INTO playlist_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, title, username, action, time, playlistId],
    });
    const isActivityAdded = result.rows[0]?.id === id;
    if (!isActivityAdded) {
      throw new InvariantError('Gagal menambahkan riwayat aktivitas');
    }
  }

  async getActivitiesByPlaylistId(id, userId) {
    await this._playlistsService.verifyPlaylistAccess(id, userId);
    const result = await this._pool.query({
      text: `
      SELECT username, s.title, action, time 
      FROM playlist_activities AS pa
      LEFT JOIN songs AS s
      ON s.id = pa.song_id
      WHERE playlist_id = $1 AND action = $2
      UNION
      SELECT username, ds.title, action, time 
      FROM playlist_activities AS pa
      LEFT JOIN deleted_songs AS ds
      ON ds.id = pa.song_id
      WHERE playlist_id = $1 AND action = $3
      ORDER BY time ASC
      `,
      values: [id, 'add', 'delete'],
    });
    return result.rows;
  }
}

module.exports = PlaylistActivitiesService;
