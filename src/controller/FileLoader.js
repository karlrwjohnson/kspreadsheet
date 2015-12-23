'use strict';

const Dom = require('../util/Dom');
const Fn = require('../util/Fn');
const FileReader = require('../util/GUIWindow').require('FileReader');

class JSONOpenException extends Error {}
class JSONParseException extends Error {}

module.exports =
class FileLoader {

  get JSONOpenException () { return JSONOpenException; }
  get JSONParseException () { return JSONParseException; }

  constructor () {
    this.element = Dom.div({style: 'display:none;'});
  }

  /**
   * @return {Promise} Resolves to a parsed JSON object
   *    May produce one of the following errors:
   *     - {FileLoader.JSONParseException} - If the JSON file could not be parsed correctly
   *     - {FileLoader.JSONOpenException} - If the JSON file could not be loaded, e.g. it doesn't exist
   */
  prompt () {
    const input = Dom.input({type: 'file'});
    this.element.appendChild(input);

    return new Promise((resolve, reject) => {
      input.addEventListener('change', () => {
        Fn.forEach(Fn.first(input.files), file => {
          const reader = new FileReader();
          reader.addEventListener('error', () =>
            reject(new JSONOpenException(
              `File ${this.element.value} could not be opened`
            ))
          );
          reader.addEventListener('load', () => {
            let spec;
            try {
              spec = JSON.parse(reader.result);
            }
            catch (e) {
              reject(new JSONParseException(
                `File ${this.element.value} appears to be corrupt, as there was ` +
                `a syntax error while trying to parse it as JSON (${e.message})`
              ));
              return;
            }
            resolve(spec);
          });
          reader.readAsText(file);
        });
      });
      input.click();
      this.element.removeChild(input);
    })
  }
};
