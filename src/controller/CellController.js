'use strict';

const bindObservers = require('../util/bindObservers');
const DiscreteDraggable = require('../view/DiscreteDraggable');
const Dom = require('../util/Dom');
const Observable = require('./../util/Observable');
const KeyCodes = require('./../KeyCodes');
const Cell = require('../model/Cell');
const Column = require('../model/Column');

const COLUMN_RESIZE_BUTTON = 1;

const NORTH = Symbol('CellController.NORTH');
const SOUTH = Symbol('CellController.SOUTH');
const EAST = Symbol('CellController.EAST');
const WEST = Symbol('CellController.WEST');
const PREVIOUS = Symbol('CellController.PREVIOUS');
const NEWLINE = Symbol('CellController.NEWLINE');
const FOCUS = Symbol('CellController.FOCUS');
const BLUR = Symbol('CellController.BLUR');

module.exports =
class CellController extends Observable {

  static get NORTH () { return NORTH; }
  static get SOUTH () { return SOUTH; }
  static get EAST () { return EAST; }
  static get WEST () { return WEST; }
  static get PREVIOUS () { return PREVIOUS; }
  static get NEWLINE () { return NEWLINE; }
  static get FOCUS () { return FOCUS; }
  static get BLUR () { return BLUR; }

  constructor (cell, column) {
    super([
      CellController.FOCUS,
      CellController.BLUR,
      CellController.NORTH,
      CellController.SOUTH,
      CellController.EAST,
      CellController.WEST,
      CellController.PREVIOUS,
      CellController.NEWLINE,
    ]);
    bindObservers(this);

    this._model_observers = [];
    this._column_observers = [];
    this._updating_model = false;
    this.element = Dom.td(
      this.inputElement = Dom.input({type:'text', value:'hello'})
    );

    this.element.controller = this;

    new DiscreteDraggable(this.element, COLUMN_RESIZE_BUTTON,
        (dx, dy) => this.column.width += dx);
    this.inputElement.addEventListener('keydown', this._on_key_down);
    this.inputElement.addEventListener('keyup', this._on_element_change);
    this.inputElement.addEventListener('mousedown', (evt) => evt.stopPropagation());
    this.inputElement.addEventListener('focus', this._on_focus);
    this.inputElement.addEventListener('blur', this._on_blur);

    this.cell = cell;
    this.column = column;
  }

  get cell () { return this._cell; }

  set cell (_) {
    this._model_observers.splice(0, Infinity).forEach(observer => observer.cancel());

    this._cell = _;

    if (this.cell) {
      this._model_observers.push(this.cell.observe(Cell.VALUE, this._on_value));
    }

    this._on_value();
  }

  get column () { return this._column; }

  set column (_) {
    this._column_observers.splice(0, Infinity).forEach(observer => observer.cancel());

    this._column = _;

    if (this.column) {
      this._column_observers.push(this.column.observe(Column.WIDTH, this._on_width));
    }

    this._on_width();
  }

  focus () {
    this.inputElement.select();
  }

  _on_value () {
    if (!this._updating_model) {
      this.inputElement.value = this.cell.value;
    }
  }

  _on_element_change () {
    this._updating_model = true;
    this.cell.value = this.inputElement.value;
    this._updating_model = false;
  }

  _on_width () {
    this.element.setAttribute('style', `width:${this.column.width}em;min-width:${this.column.width}em;`);
  }

  _on_key_down (evt) {
    switch (evt.keyCode) {
      case KeyCodes.ENTER:
        evt.preventDefault();
        this.notify(evt.shiftKey ? NORTH : NEWLINE, this);
        break;
      case KeyCodes.TAB:
        evt.preventDefault();
        this.notify(evt.shiftKey ? PREVIOUS : EAST, this);
        break;
      case KeyCodes.UP:
        evt.preventDefault();
        this.notify(NORTH, this);
        break;
      case KeyCodes.DOWN:
        evt.preventDefault();
        this.notify(SOUTH, this);
        break;
      case KeyCodes.RIGHT:
        if (this.inputElement.selectionStart === this.inputElement.value.length && 
            this.inputElement.selectionEnd === this.inputElement.value.length) {
          evt.preventDefault();
          this.notify(EAST, this)
        }
        break;
      case KeyCodes.LEFT:
        if (this.inputElement.selectionStart === 0 && 
            this.inputElement.selectionEnd === 0) {
          evt.preventDefault();
          this.notify(WEST, this)
        }
        break;
    }
  }

  _on_focus (evt) {
    this.notify(CellController.FOCUS, this);
  }

  _on_blur (evt) {
    //this.notify(CellController.BLUR, this)
  }
}
