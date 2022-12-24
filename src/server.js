const Hapi = require('@hapi/hapi');
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumValidator = require('./validator/albums');
const interveneInFailedResponse = require('./utils');
const SongsService = require('./services/postgres/SongsService');
const songs = require('./api/songs');
const SongValidator = require('./validator/songs');

require('dotenv').config();

const startServer = async () => {
  const albumsService = new AlbumsService();
  const songsService = new SongsService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register({
    plugin: albums,
    options: {
      service: albumsService,
      validator: AlbumValidator,
    },
  });
  await server.register({
    plugin: songs,
    options: {
      service: songsService,
      validator: SongValidator,
    },
  });

  interveneInFailedResponse(server);

  await server.start();

  // eslint-disable-next-line no-console
  console.log(`Server is running on ${server.info.uri}`);
};

startServer();
