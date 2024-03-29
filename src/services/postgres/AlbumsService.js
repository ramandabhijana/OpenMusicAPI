const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapRowsToModel } = require('../../mapper/albums');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const createdAt = new Date();
    const result = await this._pool.query({
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $4) RETURNING id',
      values: [id, name, year, createdAt],
    });
    const albumId = result.rows[0]?.id;
    if (!albumId) {
      throw new InvariantError('Gagal menambahkan Album');
    }
    return albumId;
  }

  async getAlbumById(id) {
    try {
      const cachedResult = await this._cacheService.get(`album:${id}`);
      return JSON.parse(cachedResult);
    } catch {
      const result = await this._pool.query({
        text: 'SELECT a.id, a.name, a.year, a.cover_url, s.id AS song_id, s.title AS song_title, s.performer AS song_performer FROM albums AS a LEFT JOIN songs AS s ON a.id = s.album_id WHERE a.id = $1',
        values: [id],
      });
      const rowsAreEmpty = !result.rowCount;
      if (rowsAreEmpty) {
        throw new NotFoundError(`Album dengan id=${id} tidak ditemukan`);
      }
      const album = mapRowsToModel(result.rows);
      await this._cacheService.set(`album:${album.id}`, JSON.stringify({
        album,
        isFromCache: true,
      }));
      return { album };
    }
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date();
    const result = await this._pool.query({
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    });
    const albumId = result.rows[0]?.id;
    if (!albumId) {
      throw new NotFoundError(`Gagal memperbarui Album. Alasan: album dengan id=${id} tidak ditemukan`);
    }
    await this._cacheService.delete(`album:${id}`);
    return albumId;
  }

  async deleteAlbumById(id) {
    const result = await this._pool.query({
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    });
    const albumId = result.rows[0]?.id;
    if (!albumId) {
      throw new NotFoundError(`Gagal menghapus Album. Alasan: album dengan id=${id} tidak ditemukan`);
    }
    await this._cacheService.delete(`album_likes_count:${albumId}`);
    await this._cacheService.delete(`album:${id}`);
    return albumId;
  }

  async editAlbumCoverUrlById(albumId, coverUrl) {
    const updatedAt = new Date();
    const result = await this._pool.query({
      text: 'UPDATE albums SET cover_url = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      values: [coverUrl, updatedAt, albumId],
    });
    const id = result.rows[0]?.id;
    if (!id) {
      throw new NotFoundError(`Gagal memperbarui sampul album. Alasan: album dengan id=${albumId} tidak ditemukan`);
    }
    await this._cacheService.delete(`album:${id}`);
  }

  async verifyAlbumExists(albumId) {
    const result = await this._pool.query({
      text: 'SELECT id FROM albums WHERE id = $1',
      values: [albumId],
    });
    const exists = result.rowCount;
    if (!exists) {
      throw new NotFoundError(`Tidak dapat menemukan album dengan id=${albumId}`);
    }
  }
}

module.exports = AlbumsService;
