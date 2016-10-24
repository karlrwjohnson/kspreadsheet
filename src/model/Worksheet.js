'use strict';
const Observable_1 = require('./../util/Observable');
const Table_1 = require('./Table');
const ADD_TABLE = Symbol('Worksheet.ADD_TABLE');
const REMOVE_TABLE = Symbol('Worksheet.REMOVE_TABLE');
class Worksheet extends Observable_1.default {
    constructor(json) {
        super([
            Worksheet.ADD_TABLE,
            Worksheet.REMOVE_TABLE,
        ]);
        this._tables = new Set();
        this._tables = new Set();
        if (json) {
            for (let table of json.tables) {
                this.addTable(new Table_1.default(table));
            }
        }
    }
    static get ADD_TABLE() { return ADD_TABLE; }
    static get REMOVE_TABLE() { return REMOVE_TABLE; }
    addTable(_) {
        this._tables.add(_);
        this.notify(Worksheet.ADD_TABLE, _);
    }
    removeTable(_) {
        this._tables.delete(_);
        this.notify(Worksheet.REMOVE_TABLE, _);
    }
    get tables() {
        return this._tables[Symbol.iterator]();
    }
    toJSON() {
        return {
            tables: Array.from(this._tables, table => table.toJSON())
        };
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Worksheet;
;
//# sourceMappingURL=Worksheet.js.map