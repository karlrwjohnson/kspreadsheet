'use strict';
const Dom = require('../util/dom');
class JSONOpenException extends Error {
}
exports.JSONOpenException = JSONOpenException;
class JSONParseException extends Error {
}
exports.JSONParseException = JSONParseException;
class FileLoader {
    constructor() {
        this.element = Dom.div({ style: { display: 'none' } });
    }
    /**
     * @return {Promise} Resolves to a parsed JSON object
     *    May produce one of the following errors:
     *     - {FileLoader.JSONParseException} - If the JSON file could not be parsed correctly
     *     - {FileLoader.JSONOpenException} - If the JSON file could not be loaded, e.g. it doesn't exist
     */
    prompt(contents) {
        const url = 'data:application/json;charset=utf-8,' + contents;
        const link = Dom.a({ download: 'file', href: url });
        this.element.appendChild(link);
        try {
            link.click();
        }
        finally {
            this.element.removeChild(link);
        }
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FileLoader;
//# sourceMappingURL=FileSaver.js.map