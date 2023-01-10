const InvariantError = require('../../exceptions/InvariantError');

const mapRowsToModel = (rows) => {
  if (!rows.length) {
    throw new InvariantError('Unexpected empty rows');
  }
  const {
    id: albumId,
    name,
    year,
    cover_url: coverUrl = null,
  } = rows[0];
  const songs = [];
  rows.forEach((row) => {
    if (row.id !== albumId) {
      throw new InvariantError('Rows contain multiple album IDs');
    }
    const {
      song_id: id,
      song_title: title,
      song_performer: performer,
    } = row;
    if (!id || !title || !performer) return;
    songs.push({ id, title, performer });
  });
  return {
    id: albumId,
    name,
    year,
    coverUrl,
    songs,
  };
};

module.exports = { mapRowsToModel };
