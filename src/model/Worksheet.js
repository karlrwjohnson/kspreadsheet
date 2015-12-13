'use strict';

const Observable = require('./../util/Observable');
const Table = require('./Table');

const ADD_TABLE = Symbol('Worksheet.ADD_TABLE');
const REMOVE_TABLE = Symbol('Worksheet.REMOVE_TABLE');

module.exports =
class Worksheet extends Observable {
  static get ADD_TABLE () { return ADD_TABLE; }
  static get REMOVE_TABLE () { return REMOVE_TABLE; }

  constructor (json) {
    super([
      Worksheet.ADD_TABLE,
      Worksheet.REMOVE_TABLE,
    ]);

    this._tables = new Set();

    if (json) {
        for (let table of json.tables) {
            this.addTable(new Table(table));
        }
    }
  }

  addTable (_) {
    this._tables.add(_);
    this.notify(Worksheet.ADD_TABLE, _);
  }

  removeTable (_) {
    this._tables.delete(_);
    this.notify(Worksheet.REMOVE_TABLE, _);
  }

  get tables () {
    return this._tables[Symbol.iterator]();
  }

  toJSON () {
    return {
      tables: Array.from(this._tables, table => table.toJSON())
    }
  }
};
