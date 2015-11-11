'use strict';

function getDimensions (array) {
  if (array.length === 0) {
    return [0, 0];
  }
  else {
    const colcount = array[0].length;
    for (let i = 1; i < array.length; i++) {
      if (colcount !== array[i].length) {
        throw Error(`Non-square array. Expected ${colcount} columns; found ${array[i].length} at index ${i}`);
      }
    }
    return [array.length, colcount];
  }
}

const TABLE_POSITION = Symbol('TABLE_POSITION');
const TABLE_SPLICE_ROWS = Symbol('TABLE_SPLICE_ROWS');
const TABLE_SPLICE_COLUMNS = Symbol('TABLE_SPLICE_COLUMNS');

class Table extends Observable {
  constructor (json) {
    super([
      TABLE_POSITION,
      TABLE_SPLICE_ROWS,
      TABLE_SPLICE_COLUMNS,
    ]);

    if (json) {
      const dimensions = getDimensions(json.data);
      if (dimensions[1] !== json.columns.length) {
        throw Error(`Number of columns (${json.columns.length}) does not ` +
            `match the width of the data (${dimensions[1]})`);
      }
      this.position = json.position;
      this.data = json.data.map(row => row.map(cell => new Cell(cell)));
      this.columns = json.columns.map(column => new Column(column));
    } else {
      this.position = [0, 0]
      this.data = [[new Cell('')]];
      this.columns = arrayFromFn(this.width, () => new Column());
    }
  }

  toJSON () {
    return {
      position: this.position,
      columns: this.columns.map(column => column.toJSON()),
      data: this.data.map(row => row.map(cell => cell.toJSON()))
    }
  }

  get position () { return this._position.slice(); }

  set position (_) {
    if (_.length !== 2) {
      throw Error('Expected 2-element vector. Got: ' + _);
    }
    else if (_[0] < 0 || _[1] < 0) {
      throw new OutOfBoundsException();
    }
    else {
      this._position = [_[0], _[1]];
      this.notify(TABLE_POSITION);
    }
  }

  getCell(row, column) {
    if (row < 0 || row >= this.height ||
        column < 0 || column >= this.width) {
      throw new OutOfBoundsException();
    }
    else {
      return this.data[row][column];
    }
  }

  *getCellsInRow(row) {
    if (row < 0 || row >= this.height) {
      throw new OutOfBoundsException();
    }
    else {
      for (let cell of this.data[row]) {
        yield cell;
      }
    }
  }

  *getCellsInColumn(column) {
    if (column < 0 || column >= this.width) {
      throw new OutOfBoundsException();
    }
    else {
      for (let i of Fn.range(this.height)) {
        yield this.data[i][column];
      }
    }
  }

  *getAllCells() {
    for (let row of this.data) {
      for (let cell of row) {
        yield cell;
      }
    }
  }

  get height () {
    return this.data.length;
  }

  set height (_) {
    if (_ < this.height) {
      this.spliceRows(_, 0, this.height - _);
    }
    else if (_ > this.height) {
      this.spliceRows(this.height, _ - this.height, 0);
    }
  }

  get width () {
    return this.data[0].length;
  }

  set width (_) {
    if (_ < this.width) {
      this.spliceColumns(_, 0, this.width - _);
    }
    else if (_ > this.width) {
      this.spliceColumns(this.width, _ - this.width, 0);
    }
  }

  spliceRows (index, insert, remove) {
    if (index < 0) {
      index = this.height - index;
    }

    if (!(index >= 0 && insert >= 0 && remove >= 0)) {
      throw new OutOfBoundsException(`index (${index}), insert (${insert}), and remove (${remove}) must all be positive numbers`);
    }
    else if (!(index + remove <= this.height)) {
      throw new OutOfBoundsException(`Rows to remove (${index} - ${index + remove}) includes rows past the end of the array (${this.height})`);
    }
    else if (index === 0 && remove === this.height && insert === 0) {
      throw new OutOfBoundsException(`No rows would be left after the splice`);
    }
    else {
      const newRows = arrayFromFn(insert, () =>
        arrayFromFn(this.width, () => new Cell())
      );

      // The splice() function is stupid because it takes the new elements as
      // variadic arguments following the index and number of elements to remove,
      // forcing me to resort to tricks like this in order to pass in an array.
      [].splice.apply(this.data, [index, remove].concat(newRows));

      // notify
      this.notify(TABLE_SPLICE_ROWS, {index: index, insert: insert, remove: remove});
    }
  }

  spliceColumns (index, insert, remove) {
    if (index < 0) {
      index = this.width - index;
    }

    if (!(index >= 0 && insert >= 0 && remove >= 0)) {
      throw new OutOfBoundsException(`index (${index}), insert (${insert}), and remove (${remove}) must all be positive numbers`);
    }
    else if (!(index + remove <= this.width)) {
      throw new OutOfBoundsException(`Columns to remove (${index} - ${index + remove}) includes columns past the end of the array (${this.width})`);
    }
    else if (index === 0 && remove === this.width && insert === 0) {
      throw new OutOfBoundsException(`No columns would be left after the splice`);
    }
    else {
      const newColumns = arrayFromFn(insert, () => new Column());
      [].splice.apply(this.columns, [index, remove].concat(newColumns));

      for (let row of this.data) {
        const newCells = arrayFromFn(insert, () => new Cell());
        [].splice.apply(row, [index, remove].concat(newCells));
      }

      // notify
      this.notify(TABLE_SPLICE_COLUMNS, {index: index, insert: insert, remove: remove});
    }
  }

}

describe('Table', ()=>{
  const defaultPosition = [3, 5];
  const defaultColumns = [{width: 4}, {width: 8}];
  const defaultData = [[{value: 'a'}, {value: 'b'}],
                       [{value: 'c'}, {value: 'c'}]];
  let table;

  function getValuesAsArray(table) {
    return table.data.map(row => row.map(cell => cell.value));
  }

  beforeEach(() => {
    table = new Table();
  })

  it('should initialize with default values', ()=>{
    const table = new Table();
    expect(table.toJSON()).toEqual({
      position: [0, 0],
      columns: [{width: 10}],
      data: [[{value: ''}]],
    });
  });

  it('should initialize from serialized data and serialize back out', ()=>{
    table = new Table({
      position: defaultPosition,
      columns: defaultColumns,
      data: defaultData,
    });
    expect(table.toJSON()).toEqual({
      position: defaultPosition,
      columns: defaultColumns,
      data: defaultData,
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
