'use strict';

const Dom = require('../util/Dom');
const Fn = require('../util/Fn');
const FileReader = require('../util/GUIWindow').require('FileReader');
const fs = require('fs');

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
  prompt (contents) {
    const input = Dom.input({type: 'file', nwsaveas: ''});
    this.element.appendChild(input);

    return new Promise((resolve, reject) => {
      input.addEventListener('change', () => {
        Fn.forEach(Fn.first(input.files), file =>
          fs.writeFileSync(file.path, contents)
        );
      });
      input.click();
      this.element.removeChild(input);
    })
  }
};
