'use strict';

const Worksheet = require('../Worksheet');
const Table = require('../Table');

describe('Worksheet', ()=>{

  it('should initialize with default data', ()=>{
    new Worksheet();
  });

  it('should initalize from serialized data', ()=>{
    const defaultTables = [
      {
        position: [0, 0],
        columns: [{width: 10}],
        data: [[{value: 'asdf'}]],
      },
    ];
    const docJson = {
      tables: defaultTables
    };
    const doc = new Worksheet(docJson);
    expect(doc.toJSON()).toEqual({
      tables: defaultTables,
    });
  });

  it('should serialize', ()=>{
    const aTable = new Table();
    const doc = new Worksheet();
    doc.addTable(aTable);
    expect(doc.toJSON()).toEqual({
      tables: [
        aTable.toJSON()
      ]
    });
  });
});
