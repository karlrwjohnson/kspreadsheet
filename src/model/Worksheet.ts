'use strict';

import Observable from './../util/Observable';
import Table, {SerializedTable} from './Table';

const ADD_TABLE = Symbol('Worksheet.ADD_TABLE');
const REMOVE_TABLE = Symbol('Worksheet.REMOVE_TABLE');

export interface SerializedWorksheet {
  tables: SerializedTable[]
}

export default class Worksheet extends Observable {
  static get ADD_TABLE () { return ADD_TABLE; }
  static get REMOVE_TABLE () { return REMOVE_TABLE; }

  _tables: Set<Table> = new Set();

  constructor (json?: SerializedWorksheet) {
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

  addTable (_: Table) {
    this._tables.add(_);
    this.notify(Worksheet.ADD_TABLE, _);
  }

  removeTable (_: Table) {
    this._tables.delete(_);
    this.notify(Worksheet.REMOVE_TABLE, _);
  }

  get tables () {
    return this._tables[Symbol.iterator]();
  }

  toJSON (): SerializedWorksheet {
    return {
      tables: Array.from(this._tables, table => table.toJSON())
    }
  }
};
