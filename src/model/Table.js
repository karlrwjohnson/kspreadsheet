'use strict';

const Cell = require('./Cell');
const Column = require('./Column');
const Fn = require('../util/Fn');
const Observable = require('../util/Observable');
const OutOfBoundsException = require('../OutOfBoundsException');

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

const POSITION = Symbol('Table.POSITION');
const SPLICE_ROWS = Symbol('Table.SPLICE_ROWS');
const SPLICE_COLUMNS = Symbol('Table.SPLICE_COLUMNS');

module.exports =
class Table extends Observable {

  static get POSITION () { return POSITION; }
  static get SPLICE_ROWS () { return SPLICE_ROWS; }
  static get SPLICE_COLUMNS () { return SPLICE_COLUMNS; }

  constructor (json) {
    super([
      Table.POSITION,
      Table.SPLICE_ROWS,
      Table.SPLICE_COLUMNS,
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
      this.position = [0, 0];
      this.data = [[new Cell('')]];
      this.columns = Fn.rangeFn(this.width, () => new Column());
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
      this.notify(POSITION);
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
      const newRows = Fn.rangeFn(insert, () =>
        Fn.rangeFn(this.width, () => new Cell())
      );

      this.data.splice(index, remove, ...newRows);

      // bump observers
      this.notify(Table.SPLICE_ROWS, {index: index, insert: insert, remove: remove});
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
      const newColumns = Fn.rangeFn(insert, () => new Column());
      this.columns.splice(index, remove, ...newColumns);

      for (let row of this.data) {
        const newCells = Fn.rangeFn(insert, () => new Cell());
        row.splice(index, remove, ...newCells);
      }

      // bump observers
      this.notify(Table.SPLICE_COLUMNS, {index: index, insert: insert, remove: remove});
    }
  }

};
