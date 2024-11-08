
const ParserService = require('./services/parser.service');
const CsvService = require('./services/csv.service');
const JSONService = require('./services/json.service');

const parserService = new ParserService('PAUL', 'en-au');

parserService.readContent().then((contents) => {
  new CsvService('cx').write(contents);
  new JSONService('cx').write(contents);
});