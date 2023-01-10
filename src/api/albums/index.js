const AlbumHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, {
    albumsService,
    albumLikesService,
    storageService,
    albumValidator,
    uploadValidator,
  }) => {
    const albumHandler = new AlbumHandler(
      albumsService,
      albumLikesService,
      storageService,
      albumValidator,
      uploadValidator,
    );
    server.route(routes(albumHandler));
  },
};
