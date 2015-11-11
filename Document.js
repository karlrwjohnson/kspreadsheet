'use strict';

const DOCUMENT_ADD_TABLE = Symbol('DOCUMENT_ADD_TABLE');
const DOCUMENT_REMOVE_TABLE = Symbol('DOCUMENT_REMOVE_TABLE');

class Document extends Observable {
  constructor (json) {
    super([
      DOCUMENT_ADD_TABLE,
      DOCUMENT_REMOVE_TABLE,
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
    this.notify(DOCUMENT_ADD_TABLE, _);
  }

  removeTable (_) {
    this._tables.delete(_);
    this.notify(DOCUMENT_REMOVE_TABLE, _);
  }

  get tables () {
    return this._tables[Symbol.iterator]();
  }

  toJSON () {
    return {
      tables: Array.from(this._tables, table => table.toJSON())
    }
  }
}

describe('Document', ()=>{

  it('should initialize with default data', ()=>{
    new Document([]);
  });

  it('should initalize from serialized data', ()=>{
    const defaultTables = [
      {
        position: [0, 0],
        columns: [{width: 10}],
        data: [[{value: 'asdf'}]],
      },
    ]
    const docJson = {
      tables: defaultTables
    }
    const doc = new Document(docJson);
    expect(doc.toJSON()).toEqual({
      tables: defaultTables,
    });
  });

  it('should serialize', ()=>{
    const aTable = new Table();
    const doc = new Document();
    doc.addTable(aTable);
    expect(doc.toJSON()).toEqual({
      tables: [
        aTable.toJSON()
      ]
    });
  });
});
