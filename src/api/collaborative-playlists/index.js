const CollaborativePlaylistHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'collaborative-playlist',
  version: '1.0.0',
  register: async (server, {
    collabPlaylistsService,
    playlistsService,
    usersService,
    validator,
  }) => {
    const handler = new CollaborativePlaylistHandler(
      collabPlaylistsService,
      playlistsService,
      usersService,
      validator,
    );
    server.route(routes(handler));
  },
};
