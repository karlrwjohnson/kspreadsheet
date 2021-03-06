'use strict';

export class Optional<T> {
  _thing: T;

  constructor (thing: T) {
    this._thing = thing;
  }

  static of (thing) {
    if (thing === null || thing === undefined) {
      throw new Error('Optional.of() cannot be called with argument ' + thing +
        '. Try ofNullable instead.');
    }
    return new Optional(thing);
  }

  static ofNullable (thing) {
    return new Optional(thing);
  }

  static ofNull () {
    return new Optional(null);
  }

  static ofUndefined () {
    return new Optional(undefined);
  }

  get() {
    if (this.has()) {
      return this._thing;
    }
    else {
      throw new Error('Cannot get value ' + this._thing + ' from Optional.');
    }
  }

  has() {
    return this._thing !== null && this._thing !== undefined;
  }

  orElseGet(otherThing: T): T {
    if (this.has()) {
      return this._thing;
    }
    else {
      return otherThing;
    }
  }

  orElseThrow(error): T {
    if (this.has()) {
      return this._thing;
    }
    else {
      throw error;
    }
  }

  ifPresent(callback: (T) => any): void {
    if (this.has()) {
      callback(this._thing);
    }
  }
}

Object.defineProperty(Optional.prototype, Symbol.iterator, {
  value: function * Optional_iterator_impl () {
    if (this.has()) {
     yield this.get();
    }
  }
});

