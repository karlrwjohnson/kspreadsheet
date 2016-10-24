'use strict';

import * as Dom from '../util/dom';
import * as Fn from '../util/fn';

export default class FileLoader {
  element: HTMLElement = Dom.div({style: { display: 'none' }});

  constructor () {}

  /**
   * @return {Promise} Resolves to a parsed JSON object
   *    May produce one of the following errors:
   *     - {FileLoader.JSONParseException} - If the JSON file could not be parsed correctly
   *     - {FileLoader.JSONOpenException} - If the JSON file could not be loaded, e.g. it doesn't exist
   */
  prompt (): Promise<string> {
    const input = Dom.input({type: 'file'});
    this.element.appendChild(input);

    return new Promise((resolve, reject) => {
      input.addEventListener('change', () => {
        Fn.first(input.files).ifPresent(file => {
          const reader = new FileReader();
          reader.addEventListener('error', () =>
            reject(new Error(
              `File ${file.path} could not be opened`
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
}
