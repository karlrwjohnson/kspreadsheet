'use strict';

import * as Dom from '../util/dom';

export class JSONOpenException extends Error {}
export class JSONParseException extends Error {}

export default class FileLoader {
  element: HTMLElement = Dom.div({style: { display: 'none' }});

  constructor () {}

  /**
   * @return {Promise} Resolves to a parsed JSON object
   *    May produce one of the following errors:
   *     - {FileLoader.JSONParseException} - If the JSON file could not be parsed correctly
   *     - {FileLoader.JSONOpenException} - If the JSON file could not be loaded, e.g. it doesn't exist
   */
  prompt (contents): Promise<void> {
    const url = 'data:application/json;charset=utf-8,' + contents;
    const link = Dom.a({ download: 'file', href: url });
    this.element.appendChild(link);
    try {
      link.click();
    } finally {
      this.element.removeChild(link);
    }

    return new Promise((resolve, reject) => {
      resolve();
    })
  }
}
