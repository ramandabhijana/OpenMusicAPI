const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const { interveneInFailedResponse, registerAuthStrategy } = require('./utils');

// ALBUM
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumValidator = require('./validator/albums');

// SONG
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongValidator = require('./validator/songs');

// USER
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

// AUTHENTICATIONS
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const AuthenticationsValidator = require('./validator/authentications');
const TokenManager = require('./tokenize/TokenManager');

// COLLABORATIVE_PLAYLIST
const collaborativePlaylists = require('./api/collaborative-playlists');
const CollaborativePlaylistsService = require('./services/postgres/CollaborativePlaylistService');
const CollaborativePlaylistsValidator = require('./validator/collaborative-playlists');

// PLAYLIST
const playlists = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistSongsService = require('./services/postgres/PlaylistSongsService');
const PlaylistActivitiesService = require('./services/postgres/PlaylistActivitiesService');
const PlaylistsValidator = require('./validator/playlists');

require('dotenv').config();

const startServer = async () => {
  const albumsService = new AlbumsService();
  const songsService = new SongsService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const collabPlaylistsService = new CollaborativePlaylistsService();
  const playlistsService = new PlaylistsService(collabPlaylistsService);
  const playlistActivitiesService = new PlaylistActivitiesService(playlistsService);
  const playlistSongsService = new PlaylistSongsService(playlistActivitiesService);

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
    plugin: Jwt,
  });

  registerAuthStrategy(server);

  await server.register([
    {
      plugin: albums,
      options: {
        service: albumsService,
        validator: AlbumValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: collaborativePlaylists,
      options: {
        collabPlaylistsService,
        playlistsService,
        usersService,
        validator: CollaborativePlaylistsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        playlistsService,
        playlistSongsService,
        playlistActivitiesService,
        songsService,
        validator: PlaylistsValidator,
      },
    },
  ]);

  interveneInFailedResponse(server);

  await server.start();

  // eslint-disable-next-line no-console
  console.log(`Server is running on ${server.info.uri}`);
};

startServer();
