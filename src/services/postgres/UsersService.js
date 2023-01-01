const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    const id = `usr-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await this._pool.query({
      text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, username, hashedPassword, fullname],
    });
    const userId = result.rows[0]?.id;
    if (!userId) {
      throw new InvariantError('Gagal menambahkan pengguna');
    }
    return userId;
  }

  async getUserById(id) {
    const result = await this._pool.query({
      text: 'SELECT id, username, fullname FROM users WHERE id = $1',
      values: [id],
    });
    const userExists = result.rowCount;
    if (!userExists) {
      throw new NotFoundError(`Pengguna dengan id=${id} tidak ditemukan`);
    }
    return result.rows[0];
  }

  async verifyUsernameIsUnique(username) {
    const result = await this._pool.query({
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    });
    const usernameIsTaken = result.rowCount;
    if (usernameIsTaken) {
      throw new InvariantError(`Pengguna dengan username "${username}" sudah terdaftar. Silahkan pilih yang lain`);
    }
  }

  async verifyUserCredential(username, password) {
    const result = await this._pool.query({
      text: 'SELECT id, password FROM users WHERE username = $1',
      values: [username],
    });
    const credentialIsInvalid = !result.rows[0];
    if (credentialIsInvalid) {
      throw new AuthenticationError('Kredensial yang diberikan salah');
    }
    const { id, password: hashedPassword } = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatches) {
      throw new AuthenticationError('Password yang diberikan tidak cocok dengan username');
    }
    return id;
  }
}

module.exports = UsersService;
