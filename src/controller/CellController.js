"use strict";
const ObserverTools = require('../util/ObserverTools');
const DiscreteDraggable_1 = require('../view/DiscreteDraggable');
const Dom = require('../util/dom');
const Observable_1 = require('../util/Observable');
const KeyCodes_1 = require('../KeyCodes');
const Cell_1 = require('../model/Cell');
const Column_1 = require('../model/Column');
const COLUMN_RESIZE_BUTTON = 1;
const NORTH = Symbol('CellController.NORTH');
const SOUTH = Symbol('CellController.SOUTH');
const EAST = Symbol('CellController.EAST');
const WEST = Symbol('CellController.WEST');
const PREVIOUS = Symbol('CellController.PREVIOUS');
const NEWLINE = Symbol('CellController.NEWLINE');
const FOCUS = Symbol('CellController.FOCUS');
const BLUR = Symbol('CellController.BLUR');
//function hasController(HTMLElement): is ControlledElement {
//
//}
class CellController extends Observable_1.default {
    constructor(cell, column) {
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
        this._model_observers = [];
        this._column_observers = [];
        this._cell = null;
        this._column = null;
        ObserverTools.autoBindCallbacks(this);
        this.element = Dom.td(this.inputElement = Dom.input({ type: 'text' }));
        this.element.controller = this;
        new DiscreteDraggable_1.default(this.element, COLUMN_RESIZE_BUTTON, (dx, dy) => this.column.width += dx);
        this.inputElement.addEventListener('keydown', this._on_key_down);
        this.inputElement.addEventListener('keyup', this._on_element_change);
        this.inputElement.addEventListener('mousedown', (evt) => evt.stopPropagation());
        this.inputElement.addEventListener('focus', this._on_focus);
        this.inputElement.addEventListener('blur', this._on_blur);
        // Intercept paste events into cells
        this.inputElement.addEventListener('paste', evt => evt.stopPropagation());
        this.cell = cell;
        this.column = column;
    }
    static get NORTH() { return NORTH; }
    static get SOUTH() { return SOUTH; }
    static get EAST() { return EAST; }
    static get WEST() { return WEST; }
    static get PREVIOUS() { return PREVIOUS; }
    static get NEWLINE() { return NEWLINE; }
    static get FOCUS() { return FOCUS; }
    static get BLUR() { return BLUR; }
    get cell() { return this._cell; }
    set cell(_) {
        if (_ === undefined) {
            throw new Error('Undefined cell');
        }
        for (let observer of this._model_observers.splice(0, Infinity)) {
            observer.cancel();
        }
        this._cell = _;
        if (this.cell) {
            this._model_observers.push(this.cell.observe(Cell_1.default.VALUE, this._on_cell_value));
            this._model_observers.push(this.cell.observe(Cell_1.default.FORMULA, this._on_cell_formula));
            this._model_observers.push(this.cell.observe(Cell_1.default.FORMULA_BAD, this._on_cell_formula_bad));
            this._model_observers.push(this.cell.observe(Cell_1.default.FORMULA_OK, this._on_cell_formula_ok));
        }
        this._on_cell_value();
    }
    get column() { return this._column; }
    set column(_) {
        for (let observer of this._column_observers.splice(0, Infinity)) {
            observer.cancel();
        }
        this._column = _;
        if (this.column) {
            this._column_observers.push(this.column.observe(Column_1.default.WIDTH, this._on_width));
        }
        this._on_width();
    }
    get focused() {
        return this.inputElement.ownerDocument.activeElement === this.inputElement;
    }
    set focused(_) {
        if (_) {
            this.inputElement.select();
            this._on_focus();
        }
        else {
            this.inputElement.blur();
            this._on_blur();
        }
    }
    _on_element_change() {
        if (this.inputElement.value.startsWith('=')) {
            this.cell.formula = this.inputElement.value.slice(1);
        }
        else {
            this.cell.value = this.inputElement.value;
        }
    }
    _on_width() {
        this.element.setAttribute('style', `width:${this.column.width}em;min-width:${this.column.width}em;`);
    }
    _on_key_down(evt) {
        switch (evt.keyCode) {
            case KeyCodes_1.default.ENTER:
                evt.preventDefault();
                this.notify(evt.shiftKey ? NORTH : NEWLINE, this);
                break;
            case KeyCodes_1.default.TAB:
                evt.preventDefault();
                this.notify(evt.shiftKey ? PREVIOUS : EAST, this);
                break;
            case KeyCodes_1.default.UP:
                evt.preventDefault();
                this.notify(NORTH, this);
                break;
            case KeyCodes_1.default.DOWN:
                evt.preventDefault();
                this.notify(SOUTH, this);
                break;
            case KeyCodes_1.default.RIGHT:
                if (this.inputElement.selectionStart === this.inputElement.value.length &&
                    this.inputElement.selectionEnd === this.inputElement.value.length) {
                    evt.preventDefault();
                    this.notify(EAST, this);
                }
                break;
            case KeyCodes_1.default.LEFT:
                if (this.inputElement.selectionStart === 0 &&
                    this.inputElement.selectionEnd === 0) {
                    evt.preventDefault();
                    this.notify(WEST, this);
                }
                break;
        }
    }
    _on_focus(evt) {
        switch (this.cell.mode) {
            case Cell_1.default.VALUE:
                break;
            case Cell_1.default.FORMULA:
                this.inputElement.value = '=' + this.cell.formula;
                break;
            default:
                throw new Error('Unhandled mode');
        }
        this.notify(CellController.FOCUS, this);
    }
    _on_blur(evt) {
        switch (this.cell.mode) {
            case Cell_1.default.VALUE:
                break;
            case Cell_1.default.FORMULA:
                this.inputElement.value = this.cell.value;
                break;
            default:
                throw new Error('Unhandled mode');
        }
        //this.notify(CellController.BLUR, this)
    }
    _on_cell_value() {
        // Never update ths UI element when it's being edited
        if (!this.focused) {
            this.inputElement.value = this.cell.value;
        }
        this.inputElement.classList.remove('formula');
        this.inputElement.classList.remove('formula-bad');
    }
    _on_cell_formula() {
        this.inputElement.classList.add('formula');
    }
    _on_cell_formula_bad() {
        this.inputElement.title = '' + this.cell.error;
        this.inputElement.classList.add('formula-bad');
    }
    _on_cell_formula_ok() {
        this.inputElement.title = '=' + this.cell.formula;
        this.inputElement.classList.remove('formula-bad');
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CellController;
;
//# sourceMappingURL=CellController.js.map