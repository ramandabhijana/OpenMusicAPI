const fs = require('fs');

class StorageService {
  constructor(path) {
    this._path = path;

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  }

  writeFile(file, meta) {
    const filename = `${+new Date()}_${meta.filename}`;
    const path = `${this._path}/${filename}`;
    const writeStream = fs.createWriteStream(path);
    return new Promise((resolve, reject) => {
      writeStream.on('error', (error) => reject(error));
      file.pipe(writeStream);
      file.on('end', () => resolve(filename));
    });
  }
}

module.exports = StorageService;
