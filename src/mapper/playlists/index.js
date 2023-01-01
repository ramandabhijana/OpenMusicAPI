const InvariantError = require('../../exceptions/InvariantError');

const mapRowsToModel = (rows) => {
  if (!rows.length) {
    throw new InvariantError('Unexpected empty rows');
  }
  const { playlist_id: playlistId, name, username } = rows[0];
  const songs = [];
  rows.forEach((row) => {
    if (row.playlist_id !== playlistId) {
      throw new InvariantError('Rows contain multiple playlist IDs');
    }
    const { id, title, performer } = row;
    songs.push({ id, title, performer });
  });
  return {
    id: playlistId,
    name,
    username,
    songs,
  };
};

module.exports = { mapRowsToModel };
