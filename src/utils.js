const ClientError = require('./exceptions/ClientError');
const config = require('./config');

const interveneInFailedResponse = (server) => {
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error === false) {
      return h.continue;
    }

    if (response instanceof ClientError) {
      return h
        .response({
          status: 'fail',
          message: response.message,
        })
        .code(response.statusCode);
    }

    if (!response.isServer) {
      return h.continue;
    }

    // eslint-disable-next-line no-console
    console.log(`Internal server error: ${response}`);

    return h.response({
      status: 'error',
      message: 'Terjadi kegagalan pada server kami',
    }).code(500);
  });
};

const registerAuthStrategy = (server) => {
  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: config.jwt.accessTokenKey,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: config.jwt.accessTokenAge,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        credentialId: artifacts.decoded.payload.userId,
        username: artifacts.decoded.payload.username,
      },
    }),
  });
};

module.exports = { interveneInFailedResponse, registerAuthStrategy };
