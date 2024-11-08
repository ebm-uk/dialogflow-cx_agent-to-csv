const fs = require('fs');
const path = require('path');

module.exports = class JSONService {
  constructor(outputFileName) {
    this._outputFileName = outputFileName;
    this._jsonFilePath = path.join(__dirname, '../output', `${this._outputFileName}.json`);
  }

  write(contents) {
    fs.writeFileSync(this._jsonFilePath, JSON.stringify(contents), 'utf8');

    console.log(`CX contents successfully wrote to ./output/${this._outputFileName}.json`);
  }
}