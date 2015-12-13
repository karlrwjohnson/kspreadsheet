'use strict';

const Cell = require('../Cell');
const Column = require('../Column');
const Table = require('../Table');

describe('Table', ()=>{
  //let MockCell;
  //let MockColumn;
  let Table_;
  let table;

  class MockCell extends Cell {
    constructor (...args) {
      super(...args);
    }
  }
  class MockColumn extends Column {
    constructor (...args) {
      super(...args);
    }
  }

  function getValuesAsArray(table) {
    return table.data.map(row => row.map(cell => cell.value));
  }

  beforeEach(() => {
    Table_ = inject(Table, {
      Cell: MockCell,
      Column: MockColumn,
    });

    table = new Table_();
  })

  it('should initialize with default values', ()=>{
    const table = new Table_();
    expect(table.toJSON()).toEqual({
      position: [0, 0],
      columns: [{width: 10}],
      data: [[{value: ''}]],
    });
  });

  it('should initialize from serialized data and serialize back out', ()=>{
    const positionJson = [3, 5];
    const columnJson = [{width: 4}, {width: 8}];
    const cellJson = [[{value: 'a'}, {value: 'b'}],
                      [{value: 'c'}, {value: 'c'}]];
    table = new Table_({
      position: [3, 5],
      columns: columnJson,
      data: cellJson,
    });
    expect(table.toJSON()).toEqual({
      position: positionJson,
      columns: columnJson,
      data: cellJson,
    });
  });

  it('should get and set its position', ()=>{
    table.position = [4, 6];
    expect(table.position).toEqual([4, 6]);
  });

  it('should not be affected when its position return value is mutated', ()=>{
    table.position[0] = 17;
    expect(table.position).toEqual([0, 0]);
  });

  it('should prevent negative positions', ()=>{
    expect(() => table.position = [-1, 1]).toThrow();
    expect(() => table.position = [1, -1]).toThrow();
    expect(() => table.position = [-1, -1]).toThrow();
  });

  it('should notify observers when its position changes', ()=>{
    const on_position = jasmine.createSpy('on_position');
    table.observe(TABLE_POSITION, on_position);
    table.position = [4, 6];
    expect(on_position).toHaveBeenCalled();
  });

  it('should insert a row at the beginning', ()=>{
    table.getCell(0,0).value = 'a';
    table.spliceRows(0, 1, 0);
    table.getCell(0,0).value = 'b';
    expect(getValuesAsArray(table)).toEqual([
      ['b'],
      ['a'],
    ]);
  });

  it('should insert a row at the end', ()=>{
    table.getCell(0,0).value = 'a';
    table.spliceRows(1, 1, 0);
    table.getCell(1,0).value = 'b';
    expect(getValuesAsArray(table)).toEqual([
      ['a'],
      ['b'],
    ]);
  });

  it('should replace all rows', ()=>{
    table.getCell(0,0).value = 'a';
    table.spliceRows(0, 2, 1);
    expect(getValuesAsArray(table)).toEqual([
      [''],
      [''],
    ]);
  });

  it('should insert a row in the middle', ()=>{
    table.spliceRows(0, 2, 1);
    table.getCell(0,0).value = 'a';
    table.getCell(1,0).value = 'b';
    table.spliceRows(1, 1, 0);
    table.getCell(1,0).value = 'c';
    expect(getValuesAsArray(table)).toEqual([
      ['a'],
      ['c'],
      ['b'],
    ]);
  });

  it('should prevent removing all rows', ()=>{
    expect(() => table.spliceRows(0, 0, 1)).toThrowError(OutOfBoundsException);
  });

  it('should send a notification when the rows are changed', ()=>{
    const on_spliceRows = jasmine.createSpy('on_spliceRows');
    table.observe(TABLE_SPLICE_ROWS, on_spliceRows);
    table.spliceRows(1, 1, 0);
    expect(on_spliceRows).toHaveBeenCalledWith(jasmine.objectContaining({
      index: 1,
      insert: 1,
      remove: 0,
    }));
  });

  it('should insert a column at the beginning', ()=>{
    table.getCell(0,0).value = 'a';
    table.spliceColumns(0, 1, 0);
    table.getCell(0,0).value = 'b';
    expect(getValuesAsArray(table)).toEqual([
      ['b', 'a'],
    ]);
  });

  it('should insert a column at the end', ()=>{
    table.getCell(0,0).value = 'a';
    table.spliceColumns(1, 1, 0);
    table.getCell(0,1).value = 'b';
    expect(getValuesAsArray(table)).toEqual([
      ['a', 'b'],
    ]);
  });

  it('should replace all columns', ()=>{
    table.getCell(0,0).value = 'a';
    table.spliceColumns(0, 2, 1);
    expect(getValuesAsArray(table)).toEqual([
      ['', ''],
    ]);
  });

  it('should insert a column in the middle', ()=>{
    table.spliceColumns(0, 2, 1);
    table.getCell(0,0).value = 'a';
    table.getCell(0,1).value = 'b';
    table.spliceColumns(1, 1, 0);
    table.getCell(0,1).value = 'c';
    expect(getValuesAsArray(table)).toEqual([
      ['a', 'c', 'b'],
    ]);
  });

  it('should prevent removing all columns', ()=>{
    expect(() => table.spliceColumns(0, 0, 1)).toThrowError(OutOfBoundsException);
  });

  it('should send a notification when the columns are changed', ()=>{
    const on_spliceColumns = jasmine.createSpy('on_spliceColumns');
    table.observe(TABLE_SPLICE_COLUMNS, on_spliceColumns);
    table.spliceColumns(1, 1, 0);
    expect(on_spliceColumns).toHaveBeenCalledWith(jasmine.objectContaining({
      index: 1,
      insert: 1,
      remove: 0,
    }));
  });

  it('should add and remove rows as the height changes', ()=>{
    table.height = 5;
    table.getCell(0,0).value = 'a';
    table.getCell(1,0).value = 'b';
    table.getCell(2,0).value = 'c';
    table.getCell(3,0).value = 'd';
    table.getCell(4,0).value = 'e';
    expect(getValuesAsArray(table)).toEqual([
      ['a'],['b'],['c'],['d'],['e'],
    ]);
    table.height = 3;
    expect(getValuesAsArray(table)).toEqual([
      ['a'],['b'],['c'],
    ]);
  });

  it('should add and remove columns as the width changes', ()=>{
    table.width = 5;
    table.getCell(0,0).value = 'a';
    table.getCell(0,1).value = 'b';
    table.getCell(0,2).value = 'c';
    table.getCell(0,3).value = 'd';
    table.getCell(0,4).value = 'e';
    expect(getValuesAsArray(table)).toEqual([
      ['a','b','c','d','e'],
    ]);
    table.width = 3;
    expect(getValuesAsArray(table)).toEqual([
      ['a','b','c'],
    ]);
  });

  describe('row and column iterators', ()=>{
    beforeEach(()=>{
      table.width = 3;
      table.height = 2;
      table.getCell(0,0).value = 'a';
      table.getCell(0,1).value = 'b';
      table.getCell(0,2).value = 'c';
      table.getCell(1,0).value = 'd';
      table.getCell(1,1).value = 'e';
      table.getCell(1,2).value = 'f';
    });

    it('should iterate over the cells in a row', ()=>{
      function valuesInRow(r) {
        return Fn.arrayFromItr(table.getCellsInRow(r)).map(cell => cell.value);
      }
      expect(valuesInRow(0)).toEqual(['a','b','c']);
      expect(valuesInRow(1)).toEqual(['d','e','f']);
    });

    it('should iterate over the cells in a column', ()=>{
      function valuesInColumn(c) {
        return Fn.arrayFromItr(table.getCellsInColumn(c)).map(cell => cell.value);
      }
      expect(valuesInColumn(0)).toEqual(['a','d']);
      expect(valuesInColumn(1)).toEqual(['b','e']);
      expect(valuesInColumn(2)).toEqual(['c','f']);
    });
  });

});
