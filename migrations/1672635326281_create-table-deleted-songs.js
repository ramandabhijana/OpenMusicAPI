exports.up = (pgm) => {
  pgm.createTable('deleted_songs', {}, {
    like: {
      table: 'songs',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('deleted_songs');
};
