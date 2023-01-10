const autoBind = require('auto-bind');
const NotFoundError = require('../../exceptions/NotFoundError');
const config = require('../../config');

class AlbumHandler {
  constructor(albumsService, albumLikesService, storageService, albumValidator, uploadValidator) {
    this._albumsService = albumsService;
    this._albumLikesService = albumLikesService;
    this._storageService = storageService;
    this._albumValidator = albumValidator;
    this._uploadValidator = uploadValidator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._albumValidator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
    const albumId = await this._albumsService.addAlbum({ name, year });
    return h.response({
      status: 'success',
      data: { albumId },
    }).code(201);
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const { album, isFromCache } = await this._albumsService.getAlbumById(id);
    const response = h.response({
      status: 'success',
      data: { album },
    });
    if (isFromCache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }

  async putAlbumByIdHandler(request) {
    this._albumValidator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    await this._albumsService.editAlbumById(id, request.payload);
    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._albumsService.deleteAlbumById(id);
    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postAlbumCoverHandler(request, h) {
    const { id: albumId } = request.params;
    const { cover } = request.payload;
    this._uploadValidator.validateImageHeaders(cover.hapi.headers);
    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const coverUrl = `http://${config.server.host}:${config.server.port}/album-covers/${filename}`;
    await this._albumsService.editAlbumCoverUrlById(albumId, coverUrl);
    return h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    }).code(201);
  }

  async postAlbumLikesHandler(request, h) {
    const { id: albumId } = request.params;
    const { credentialId: userId } = request.auth.credentials;
    let message;
    await this._albumsService.verifyAlbumExists(albumId);
    try {
      await this._albumLikesService.removeLike(albumId, userId);
      message = 'Berhasil batal menyukai album';
    } catch (error) {
      if (error instanceof NotFoundError === false) {
        throw error;
      }
      await this._albumLikesService.addLike(albumId, userId);
      message = 'Berhasil menyukai album';
    }
    return h.response({
      status: 'success',
      message,
    }).code(201);
  }

  async getAlbumLikesHandler(request, h) {
    const { id } = request.params;
    const { count, isFromCache } = await this._albumLikesService.getLikesCount(id);
    const response = h.response({
      status: 'success',
      data: { likes: Number(count) },
    });
    if (isFromCache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }
}

module.exports = AlbumHandler;
