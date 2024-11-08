const csvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');

module.exports = class CsvService {
  constructor(outputFileName) {
    this._outputFileName = outputFileName;
    this._csvFilePath = path.join(__dirname, '../output', `${this._outputFileName}.csv`);

    this._csvHeaders = [
      { id: 'name', title: 'Name' },
      { id: 'trainingPhrases', title: 'Training Phrases' },
      { id: 'responses', title: 'Responses' }
    ];
  }

  write(contents) {
    const csvData = contents.map(intent => ({
      name: intent.name,
      trainingPhrases: intent.trainingPhrases.join('\n'),
      responses: intent.responses.join('\n')
    }));

    const writer = csvWriter({
      path: this._csvFilePath,
      header: this._csvHeaders
    });

    writer.writeRecords(csvData)
      .then(() => {
        console.log(`CX contents successfully wrote to ./output/${this._outputFileName}.csv`);
      })
      .catch(err => {
        console.error('Error writing CSV file:', err);
      });
  }
};