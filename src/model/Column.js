'use strict';

const Observable = require('./../util/Observable');
const OutOfBoundsException = require('../OutOfBoundsException');

const WIDTH = Symbol('Column.WIDTH');

class Column extends Observable {

  static get WIDTH () { return WIDTH; }

  constructor (json) {
    super([Column.WIDTH]);

    if (json) {
      this.width = json.width;
    }
    else {
      this._width = 10;
    }
  }

  toJSON () {
    return {
      width: this.width,
    };
  }

  get width () { return this._width; }

  set width (_) {
    if (_ <= 0) {
      throw new OutOfBoundsException('Negative width');
    }
    else if (typeof _ !== 'number') {
      throw new TypeError('Width must be a number');
    }
    else {
      this._width = _;
      this.notify(Column.WIDTH);
    }
  }
}

module.exports = Column;
