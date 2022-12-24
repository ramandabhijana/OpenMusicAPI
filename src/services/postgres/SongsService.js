const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModel } = require('../../mapper/songs');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title,
    year,
    genre,
    performer,
    duration,
    albumId,
  }) {
    const id = nanoid(16);
    const createdAt = new Date();
    const updatedAt = createdAt;
    const result = await this._pool.query({
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId, createdAt, updatedAt],
    });
    const songId = result.rows[0]?.id;
    if (!songId) {
      throw new InvariantError('Gagal menambahkan Lagu');
    }
    return songId;
  }

  async getSongs({ title, performer }) {
    const hasTitleOrPerformerQuery = title !== null || performer !== null;
    if (!hasTitleOrPerformerQuery) {
      const result = await this._pool.query('SELECT id, title, performer FROM songs');
      return result.rows;
    }
    let extraDBQueryText = 'WHERE';
    const extraDBQueryValues = [];
    if (title !== null) {
      extraDBQueryText += " title ILIKE $1 || '%'";
      extraDBQueryValues.push(title);
    }
    if (performer !== null) {
      if (extraDBQueryValues.includes(title)) {
        extraDBQueryText += ' AND';
      }
      const valuePosition = extraDBQueryValues.length + 1;
      extraDBQueryText += ` performer ILIKE $${valuePosition} || '%'`;
      extraDBQueryValues.push(performer);
    }
    const result = await this._pool.query({
      text: `SELECT id, title, performer FROM songs ${extraDBQueryText}`,
      values: extraDBQueryValues,
    });
    return result.rows;
  }

  async getSongById(id) {
    const result = await this._pool.query({
      text: 'SELECT id, title, year, genre, performer, duration, album_id FROM songs WHERE id = $1',
      values: [id],
    });
    const rowsAreEmpty = !result.rows.length;
    if (rowsAreEmpty) {
      throw new NotFoundError(`Lagu dengan id=${id} tidak ditemukan`);
    }
    return result.rows.map(mapDBToModel)[0];
  }

  async editSongById(
    id,
    {
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
    },
  ) {
    const updatedAt = new Date();
    const result = await this._pool.query({
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, album_id = $6, updated_at = $7 WHERE id = $8 RETURNING id',
      values: [title, year, genre, performer, duration, albumId, updatedAt, id],
    });
    const songId = result.rows[0]?.id;
    if (!songId) {
      throw new NotFoundError(`Gagal memperbarui Lagu. Alasan: lagu dengan id=${id} tidak ditemukan`);
    }
    return songId;
  }

  async deleteSongById(id) {
    const result = await this._pool.query({
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    });
    const songId = result.rows[0]?.id;
    if (!songId) {
      throw new NotFoundError(`Gagal menghapus Lagu. Alasan: lagu dengan id=${id} tidak ditemukan`);
    }
    return songId;
  }
}

module.exports = SongsService;