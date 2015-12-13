'use strict';

const Observable = require('./../util/Observable');

const VALUE = Symbol('Cell.VALUE');

class Cell extends Observable {

  static get VALUE () { return VALUE; }

  constructor (json) {
    super([Cell.VALUE]);

    if (json) {
      this.value = json.value;
    } else {
      this.value = '';
    }
  }

  toJSON () {
    return {
      value: this.value
    }
  }

  get value () { return this._value; }

  set value (_) {
    this._value = _;
    this.notify(Cell.VALUE);
  }

  isEmpty () {
    return this._value === '';
  }
}

module.exports = Cell;
