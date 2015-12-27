'use strict';

const Arithmetic = require('../demo/Arithmetic');
const Lexer = require('../parser/Lexer');
const Observable = require('../util/Observable');
const ParseError = require('../parser/ParseError');

const VALUE = Symbol('Cell.VALUE');
const FORMULA = Symbol('Cell.FORMULA');
const MODE = Symbol('Cell.MODE');
const FORMULA_BAD = Symbol('Cell.FORMULA_BAD');
const FORMULA_OK = Symbol('Cell.FORMULA_OK');

class Cell extends Observable {

  static get VALUE () { return VALUE; }
  static get FORMULA () { return FORMULA; }
  static get MODE () { return MODE; }
  static get FORMULA_BAD () { return FORMULA_BAD; }
  static get FORMULA_OK () { return FORMULA_OK; }

  constructor (json) {
    super([
      Cell.VALUE,
      Cell.FORMULA,
      Cell.MODE,
      Cell.FORMULA_BAD,
      Cell.FORMULA_OK,
    ]);

    if (json) {
      if ('value' in json) {
        if ('formula' in json) {
          throw new Error('Cannot have both a value and a formula for a cell');
        }
        else {
          this.value = json.value;
        }
      }
      else {
        if ('formula' in json) {
          this.formula = json.formula;
        }
        else {
          throw new Error('Expected either a value of a formula for a cell');
        }
      }

      if ('error' in json) {
        this.error = json.error;
      }
    } else {
      this.value = '';
      this.error = false;
    }
  }

  toJSON () {
    const ret = {};
    switch (this.mode) {
      case Cell.VALUE:
        ret.value = this.value;
        break;
      case Cell.FORMULA:
        ret.formula = this.formula;
        break;
      default:
        throw new Error('Unhandled mode ' + this.mode);
    }
    if (this.error !== false) {
      ret.error = this.error;
    }
    return ret;
  }

  get mode () {
    return this.formula === null ? VALUE : FORMULA;
  }

  get formula () { return this._formula; }

  set formula (_) {
    this._formula = _;
    this.notify(Cell.FORMULA);

    let calculation = null;
    let err = null;
    try {
      calculation = Arithmetic.exec(this.formula);
    }
    catch (e) {
      if (e instanceof ParseError || e instanceof Lexer.Error) {
        err = e;
      }
      else {
        throw e;
      }
    }

    if (calculation === null) {
      this._value = '=' + this._formula;
      this.error = err.message;
      this.notify(Cell.FORMULA_BAD);
    }
    else {
      this._value = calculation;
      this.error = false;
      this.notify(Cell.FORMULA_OK);
    }
  }

  get value () { return this._value; }

  set value (_) {
    this._value = _;
    this._formula = null;
    this.notify(Cell.VALUE);
  }

  isEmpty () {
    return this._value === '';
  }
}

module.exports = Cell;
