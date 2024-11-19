const fs = require('fs');
const path = require('path');

module.exports = class ParserService {
  constructor(agentName, languageCode) {
    this._agentName = agentName;

    this._languageCode = languageCode;
  }

  async readContent() {
    let intents = await this._readIntents();

    await this._readRootJSON(intents, path.join(this._agentName, `${this._agentName}.json`));

    await this._readTransitionRoutes(intents);

    return intents;
  }

  _readIntents() {
    const intentFile = `${this._languageCode}.json`;

    return new Promise((resolve) => {
      const intentsDir = path.join(__dirname, '../export', 'intents');

      const intents = [];

      fs.readdir(intentsDir, (err, folders) => {
        if (err) {
          console.error('Error reading intents directory:', err);
          return;
        }

        folders.forEach(folder => {
          const folderPath = path.join(intentsDir, folder);

          const intent = {
            name: decodeURIComponent(folder),
            trainingPhrases: [],
            responses: []
          };

          if (fs.existsSync(path.join(folderPath, 'trainingPhrases'))) {
            const filePath = path.join(folderPath, 'trainingPhrases', intentFile);


            if (fs.existsSync(filePath)) {
              fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                  console.error(`Error reading file ${filePath}: `, err);
                  return;
                }

                try {
                  const jsonData = JSON.parse(data);
                  for (let i = 0; i < jsonData.trainingPhrases.length; i++) {
                    intent.trainingPhrases.push(jsonData.trainingPhrases[i].parts.map(p => p.text).join(''));
                  }
                } catch (parseErr) {
                  console.error(`Error parsing JSON from file ${filePath}: `, parseErr);
                }
              });
            }
          }

          intents.push(intent);
        });

        resolve(intents);
      });
    });
  }

  _readRootJSON(intents) {
    return new Promise(async (resolve) => {
      const flowFilePath = path.join(__dirname, '../export', 'flows', this._agentName, `${this._agentName}.json`);

      if (fs.existsSync(flowFilePath)) {
        fs.readFile(flowFilePath, 'utf8', async (err, data) => {
          if (err) {
            console.error(`Error reading file ${flowFilePath}: `, err);
            return;
          }

          try {
            const jsonData = JSON.parse(data);

            for (let i = 0; i < jsonData.transitionRoutes.length; i++) {
              const intent = intents.find(intent => intent.name === jsonData.transitionRoutes[i].intent);

              if (intent) {
                const intentResponses = await this._buildTransitionRouteResponsesFromJSON(jsonData.transitionRoutes[i]);

                for (let j = 0; j < intentResponses.length; j++) {
                  intent.responses.push(intentResponses[j]);
                }
              }
            }

          } catch (parseErr) {
            console.error(`Error parsing JSON from file ${flowFilePath}: `, parseErr);
          }

          resolve();
        });
      } else {
        console.error(`File ${flowFilePath} does not exist.`);
      }
    });
  }

  _readTransitionRoutes(intents) {
    return new Promise(async (resolve) => {
      const transitionsPath = path.join(__dirname, '../export', 'flows', this._agentName, 'transitionRouteGroups');

      fs.readdir(transitionsPath, async (err, files) => {
        for (let i = 0; i < files.length; i++) {
          await this._readTransitionRoute(intents, path.join(transitionsPath, files[i]));
        }
        resolve();
      });
    });
  }

  _readTransitionRoute(intents, filePath) {
    return new Promise(async (resolve) => {
      if (fs.existsSync(filePath)) {
        fs.readFile(filePath, 'utf8', async (err, data) => {
          if (err) {
            console.error(`Error reading file ${filePath}: `, err);
            return;
          }

          try {
            const jsonData = JSON.parse(data);

            for (let i = 0; i < jsonData.transitionRoutes.length; i++) {
              const intent = this._getIntent(intents, jsonData.transitionRoutes[i].intent);

              if (intent) {
                const intentResponses = await this._buildTransitionRouteResponsesFromJSON(jsonData.transitionRoutes[i]);

                for (let j = 0; j < intentResponses.length; j++) {
                  intent.responses.push(intentResponses[j]);
                }
              }
            }
          } catch (parseErr) {
            console.error(`Error parsing JSON from file ${filePath}: `, parseErr);
          }

          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  _readPage(pageName) {
    return new Promise(async (resolve, reject) => {
      const pagePath = path.join(__dirname, '../export', 'flows', this._agentName, 'pages', `${pageName}.json`);

      if (fs.existsSync(pagePath)) {
        fs.readFile(pagePath, 'utf8', async (err, data) => {
          if (err) {
            console.error(`Error reading file ${pagePath}: `, err);

            reject(`Error reading file ${pagePath}`);
          }

          try {
            const jsonData = JSON.parse(data);

            resolve(this._buildPageResponsesFromJSON(jsonData));
          } catch (parseErr) {
            console.error(`Error parsing JSON from file ${pagePath}: `, parseErr);

            reject(`Error parsing JSON from file ${pagePath}`);
          }
        });
      } else {
        reject([]);
      }
    });
  }

  async _buildTransitionRouteResponsesFromJSON(transitionRoute) {
    const responses = [];

    if (transitionRoute.triggerFulfillment.messages) {
      for (let i = 0; i < transitionRoute.triggerFulfillment.messages.length; i++) {
        if (transitionRoute.triggerFulfillment.messages[i].languageCode === this._languageCode) {
          if (transitionRoute.triggerFulfillment.messages[i].text) {
            for (let j = 0; j < transitionRoute.triggerFulfillment.messages[i].text.text.length; j++) {
              responses.push(transitionRoute.triggerFulfillment.messages[i].text.text[j]);
            }
          }

          if (transitionRoute.triggerFulfillment.messages[i].payload && transitionRoute.triggerFulfillment.messages[i].payload.buttons) {
            responses.push(`BUTTONS: ${transitionRoute.triggerFulfillment.messages[i].payload.buttons.join(', ')} `);
          }
        }
      }
    }

    if (transitionRoute.targetPage && (transitionRoute.condition == null || transitionRoute.condition.length === 0)) {
      const pageResponses = await this._readPage(transitionRoute.targetPage);

      for (let j = 0; j < pageResponses.length; j++) {
        responses.push(pageResponses[j]);
      }
    }

    return responses;
  }

  async _buildPageResponsesFromJSON(jsonData) {
    const responses = [];

    if (jsonData.entryFulfillment && jsonData.entryFulfillment.messages) {
      if (jsonData.entryFulfillment.messages) {
        for (let i = 0; i < jsonData.entryFulfillment.messages.length; i++) {
          if (jsonData.entryFulfillment.messages[i].languageCode === this._languageCode) {
            if (jsonData.entryFulfillment.messages[i].text) {
              for (let j = 0; j < jsonData.entryFulfillment.messages[i].text.text.length; j++) {
                responses.push(jsonData.entryFulfillment.messages[i].text.text[j]);
              }
            }

            if (jsonData.entryFulfillment.messages[i].payload) {
              if (jsonData.entryFulfillment.messages[i].payload.buttons) {
                responses.push(`BUTTONS: ${jsonData.entryFulfillment.messages[i].payload.buttons.join(', ')} `);
              }
            }
          }
        }
      }
    }

    return responses;
  }

  _getIntent(intents, intentName) {
    return intents.find(intent => intent.name === intentName);
  }
}