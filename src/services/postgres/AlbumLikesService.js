const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumLikesService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addLike(albumId, userId) {
    const id = `album_likes-${nanoid(16)}`;
    const result = await this._pool.query({
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    });
    const isAdded = result.rows[0]?.id === id;
    if (!isAdded) {
      throw new InvariantError('Gagal menyukai album');
    }
    await this._cacheService.delete(`album_likes_count:${albumId}`);
  }

  async removeLike(albumId, userId) {
    const result = await this._pool.query({
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    });
    const id = result.rows[0]?.id;
    if (!id) {
      throw new NotFoundError('Tidak dapat batal menyukai album. Alasan: Riwayat menyukai tidak ditemukan');
    }
    await this._cacheService.delete(`album_likes_count:${albumId}`);
  }

  async getLikesCount(albumId) {
    const cacheKey = `album_likes_count:${albumId}`;
    try {
      const cachedResult = await this._cacheService.get(cacheKey);
      return JSON.parse(cachedResult);
    } catch {
      const result = await this._pool.query({
        text: 'SELECT COUNT(id) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      });
      const resultHasRow = result.rowCount;
      if (!resultHasRow) {
        throw new InvariantError('Gagal mendapatkan data');
      }
      const { count } = result.rows[0];
      await this._cacheService.set(cacheKey, JSON.stringify({
        count,
        isFromCache: true,
      }));
      return { count };
    }
  }
}

module.exports = AlbumLikesService;
