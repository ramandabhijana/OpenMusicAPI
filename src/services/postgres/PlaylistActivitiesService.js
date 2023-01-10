const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

class PlaylistActivitiesService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addActivity(playlistId, { songId, username, action }) {
    const id = `playlist_activities-${nanoid(16)}`;
    const time = new Date();
    const result = await this._pool.query({
      text: 'INSERT INTO playlist_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, songId, username, action, time, playlistId],
    });
    const isActivityAdded = result.rows[0]?.id === id;
    if (!isActivityAdded) {
      throw new InvariantError('Gagal menambahkan riwayat aktivitas');
    }
    await this._cacheService.delete(`playlist_activities:${playlistId}`);
  }

  async getActivitiesByPlaylistId(id) {
    try {
      const cachedResult = await this._cacheService.get(`playlist_activities:${id}`);
      return JSON.parse(cachedResult);
    } catch {
      const result = await this._pool.query({
        text: `
        SELECT username, COALESCE(s.title, ds.title) AS title, action, time 
        FROM playlist_activities
        LEFT JOIN songs AS s
        ON s.id = song_id
        LEFT JOIN deleted_songs AS ds
        ON ds.id = song_id
        WHERE playlist_id = $1
        ORDER BY time ASC
        `,
        values: [id],
      });
      const activities = result.rows;
      await this._cacheService.set(`playlist_activities:${id}`, JSON.stringify({
        activities,
        isFromCache: true,
      }));
      return { activities };
    }
  }
}

module.exports = PlaylistActivitiesService;
