'use strict';

const COLUMN_RESIZE_BUTTON = 1;

const NORTH = Symbol('NORTH');
const SOUTH = Symbol('SOUTH');
const EAST = Symbol('EAST');
const WEST = Symbol('WEST');
const PREVIOUS = Symbol('PREVIOUS');
const NEWLINE = Symbol('NEWLINE');

const CELL_CONTROLLER_FOCUS = Symbol('CELL_CONTROLLER_FOCUS');
const CELL_CONTROLLER_BLUR = Symbol('CELL_CONTROLLER_BLUR');

class CellController extends Observable {
  constructor (cell, column) {
    super([
      CELL_CONTROLLER_FOCUS,
      CELL_CONTROLLER_BLUR,
      NORTH,
      SOUTH,
      EAST,
      WEST,
      PREVIOUS,
      NEWLINE,
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
      this._model_observers.push(this.cell.observe(CELL_VALUE, this._on_value));
    }

    this._on_value();
  }

  get column () { return this._column; }

  set column (_) {
    this._column_observers.splice(0, Infinity).forEach(observer => observer.cancel());

    this._column = _;

    if (this.column) {
      this._column_observers.push(this.column.observe(COLUMN_WIDTH, this._on_width));
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
      case ENTER_KEY_CODE:
        evt.preventDefault();
        this.notify(evt.shiftKey ? NORTH : NEWLINE, this);
        break;
      case TAB_KEY_CODE:
        evt.preventDefault();
        this.notify(evt.shiftKey ? PREVIOUS : EAST, this);
        break;
      case UP_KEY_CODE:
        evt.preventDefault();
        this.notify(NORTH, this);
        break;
      case DOWN_KEY_CODE:
        evt.preventDefault();
        this.notify(SOUTH, this);
        break;
      case RIGHT_KEY_CODE:
        if (this.inputElement.selectionStart === this.inputElement.value.length && 
            this.inputElement.selectionEnd === this.inputElement.value.length) {
          evt.preventDefault();
          this.notify(EAST, this)
        }
        break;
      case LEFT_KEY_CODE:
        if (this.inputElement.selectionStart === 0 && 
            this.inputElement.selectionEnd === 0) {
          evt.preventDefault();
          this.notify(WEST, this)
        }
        break;
    }
  }

  _on_focus (evt) {
    this.notify(CELL_CONTROLLER_FOCUS, this);
  }

  _on_blur (evt) {
    //this.notify(CELL_CONTROLLER_BLUR, this)
  }
}
