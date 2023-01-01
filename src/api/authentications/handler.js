const autoBind = require('auto-bind');

class AuthenticationsHandler {
  constructor(authenticationsService, usersService, tokenManager, validator) {
    this._authenticationService = authenticationsService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    autoBind(this);
  }

  async postAuthenticationHandler(request, h) {
    this._validator.validatePostAuthenticationPayload(request.payload);
    const { username, password } = request.payload;
    const userId = await this._usersService.verifyUserCredential(username, password);
    const accessToken = this._tokenManager.generateAccessToken({ userId, username });
    const refreshToken = this._tokenManager.generateRefreshToken({ userId, username });
    await this._authenticationService.addRefreshToken(refreshToken);
    return h.response({
      status: 'success',
      data: {
        accessToken,
        refreshToken,
      },
    }).code(201);
  }

  async putAuthenticationHandler(request) {
    this._validator.validatePutAuthenticationPayload(request.payload);
    const { refreshToken } = request.payload;
    await this._authenticationService.verifyRefreshToken(refreshToken);
    const { userId, username } = this._tokenManager.verifyRefreshToken(refreshToken);
    const accessToken = this._tokenManager.generateAccessToken({ userId, username });
    return {
      status: 'success',
      data: { accessToken },
    };
  }

  async deleteAuthenticationHandler(request) {
    this._validator.validateDeleteAuthenticationPayload(request.payload);
    const { refreshToken } = request.payload;
    await this._authenticationService.verifyRefreshToken(refreshToken);
    await this._authenticationService.deleteRefreshToken(refreshToken);
    return {
      status: 'success',
      message: 'Berhasil menghapus refresh token',
    };
  }
}

module.exports = AuthenticationsHandler;
