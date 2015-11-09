'use strict';

const DOCUMENT_ADD_TABLE = Symbol('DOCUMENT_ADD_TABLE');
const DOCUMENT_REMOVE_TABLE = Symbol('DOCUMENT_REMOVE_TABLE');

class Document extends Observable {
  constructor (tables) {
    super([
      DOCUMENT_ADD_TABLE,
      DOCUMENT_REMOVE_TABLE,
    ]);
    this._tables = new Set();

    for (let table of (tables || [])) {
      this.addTable(table);
    }
  }

  addTable (_) {
    this._tables.add(_);
    this.notify(DOCUMENT_ADD_TABLE, _);
  }

  removeTable (_) {
    this._tables.delete(_);
    this.notify(DOCUMENT_REMOVE_TABLE, _);
  }
}
