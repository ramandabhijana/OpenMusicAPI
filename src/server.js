const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');
const { interveneInFailedResponse, registerAuthStrategy } = require('./utils');
const config = require('./config');

// ALBUM
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumLikesService = require('./services/postgres/AlbumLikesService');
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

// EXPORT
const exportPlaylist = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

// UPLOAD & STORAGE
const UploadsValidator = require('./validator/uploads');
const StorageService = require('./services/storage/StorageService');

// CACHE
const CacheService = require('./services/redis/CacheService');

const startServer = async () => {
  const cacheService = new CacheService();
  const albumsService = new AlbumsService(cacheService);
  const songsService = new SongsService(cacheService);
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const collabPlaylistsService = new CollaborativePlaylistsService(cacheService);
  const playlistsService = new PlaylistsService(collabPlaylistsService, cacheService);
  const playlistActivitiesService = new PlaylistActivitiesService(cacheService);
  const playlistSongsService = new PlaylistSongsService(playlistActivitiesService);
  const albumLikesService = new AlbumLikesService(cacheService);
  const storageService = new StorageService(path.resolve(__dirname, 'api/uploaded-file/images'));

  const server = Hapi.server({
    port: config.server.port,
    host: config.server.host,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    { plugin: Jwt },
    { plugin: Inert },
  ]);

  registerAuthStrategy(server);

  await server.register([
    {
      plugin: albums,
      options: {
        albumsService,
        albumLikesService,
        storageService,
        albumValidator: AlbumValidator,
        uploadValidator: UploadsValidator,
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
    {
      plugin: exportPlaylist,
      options: {
        producerService: ProducerService,
        playlistsService,
        validator: ExportsValidator,
      },
    },
  ]);

  interveneInFailedResponse(server);

  await server.start();

  // eslint-disable-next-line no-console
  console.log(`Server is running on ${server.info.uri}`);
};

startServer();
