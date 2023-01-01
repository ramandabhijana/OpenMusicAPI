const PlaylistHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server, {
    playlistsService,
    playlistSongsService,
    playlistActivitiesService,
    songsService,
    validator,
  }) => {
    const handler = new PlaylistHandler(
      playlistsService,
      playlistSongsService,
      playlistActivitiesService,
      songsService,
      validator,
    );
    server.route(routes(handler));
  },
};
