const autoBind = require('auto-bind');

class UsersHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postUserHandler(request, h) {
    this._validator.validateUserPayload(request.payload);
    const { username } = request.payload;
    await this._service.verifyUsernameIsUnique(username);
    const userId = await this._service.addUser(request.payload);
    return h.response({
      status: 'success',
      data: { userId },
    }).code(201);
  }
}

module.exports = UsersHandler;
