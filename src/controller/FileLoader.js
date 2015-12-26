'use strict';

const Dom = require('../util/Dom');
const Fn = require('../util/Fn');
const FileReader = require('../util/GUIWindow').require('FileReader');

module.exports =
class FileLoader {

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
            reject(new Error(
              `File ${this.element.value} could not be opened`
            ))
          );
          reader.addEventListener('load', () => {
            resolve(reader.result);
          });
          reader.readAsText(file);
        });
      });
      input.click();
      this.element.removeChild(input);
    })
  }
};
