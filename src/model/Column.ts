'use strict';

import Observable from '../util/Observable';
import { OutOfBoundsException } from '../exceptions';

const WIDTH = Symbol('Column.WIDTH');

export interface SerializedColumn {
  width: number;
}

export default class Column extends Observable {

  static get WIDTH () { return WIDTH; }

  _width: number = 10;

  constructor (json?) {
    super([Column.WIDTH]);

    if (json) {
      this.width = json.width;
    }
  }

  toJSON (): SerializedColumn {
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
