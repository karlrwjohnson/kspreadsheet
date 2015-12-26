'use strict';

const bindObservers = require('../util/bindObservers');
const CellController = require('./CellController');
const DiscreteDraggable = require('../view/DiscreteDraggable');
const Dom = require('../util/Dom');
const Fn = require('../util/Fn');
const IllegalArgumentException = require('../IllegalArgumentException');
const Observable = require('../util/Observable');
const Table = require('../model/Table');
const Vec = require('../util/Vec');

const TABLE_MOVE_BUTTON = 1;

const EMPTY_BLUR = Symbol('TableController.EMPTY_BLUR');
const FOCUS = Symbol('TableController.FOCUS');
const BLUR = Symbol('TableController.BLUR');

class TableController extends Observable {

  static get EMPTY_BLUR () { return EMPTY_BLUR; }
  static get FOCUS () { return FOCUS; }
  static get BLUR () { return BLUR; }

  constructor (model) {
    super([
      TableController.EMPTY_BLUR,
      TableController.FOCUS,
      TableController.BLUR,
    ]);
    bindObservers(this);

    this._model_observers = [];
    this._focused = false;
    this._focusedCellController = null;
    this.element = Dom.table(
      /*thead(
        this.colHeaderContainer = Dom.tr()
      ),*/
      this.rowContainer = Dom.tbody()
    );

    this.element.addEventListener('dblclick', this._on_dblclick);

    new DiscreteDraggable(this.element, TABLE_MOVE_BUTTON,
        (dx, dy) => this.model.position = Vec.add(this.model.position, [dx, dy]));

    this.model = model;
  }

  get model () {
    return this._model;
  }

  set model (_) {
    // Remove old observers
    let observer;
    while ((observer = this._model_observers.pop())) {
      observer.cancel();
    }

    // Remove old DOM
    Dom.removeChildren(this.rowContainer);

    // Reset focus
    this.focusedCellController = null;

    this._model = _;

    // Create DOM for rows
    for (let r of Fn.range(this.model.height)) {
      const rowView = this._makeRowView(this.model.getCellsInRow(r));
      this.rowContainer.appendChild(rowView);
    }

    // Add new observers
    this._model_observers.push(this.model.observe(Table.POSITION, this._on_position));
    this._model_observers.push(this.model.observe(Table.SPLICE_ROWS, this._on_row_splice));
    this._model_observers.push(this.model.observe(Table.SPLICE_COLUMNS, this._on_column_splice));

    // Init properties
    this._on_position();
  }

  _makeRowView(modelRow) {
    const rowElement = Dom.tr();
    for (let cell_column of Fn.zip(modelRow, this.model.columns)) {
      const model_cell = cell_column[0]; // No destructuring assignment yet
      const column = cell_column[1];

      const cellController = this._makeCellController(model_cell, column);
      rowElement.appendChild(cellController.element);
    }
    return rowElement;
  }

  _makeCellController(modelCell, column) {
    const cellController = new CellController(modelCell, column);
    cellController.observe(CellController.NORTH, this._on_navigate_north);
    cellController.observe(CellController.SOUTH, this._on_navigate_south);
    cellController.observe(CellController.EAST, this._on_navigate_east);
    cellController.observe(CellController.WEST, this._on_navigate_west);
    cellController.observe(CellController.PREVIOUS, this._on_navigate_previous);
    cellController.observe(CellController.NEWLINE, this._on_navigate_newline);
    cellController.observe(CellController.FOCUS, this._on_cell_controller_focus);
    cellController.observe(CellController.BLUR, this._on_cell_controller_blur);
    return cellController;
  }

  _on_dblclick (evt) {
    evt.stopPropagation();
  }

  _on_position () {
    const position = this.model.position;
    this.element.setAttribute('style', `left:${position[0]}em;top:${position[1]}em;`)
  }

  getRelativeCellController (cellController, direction) {
    const parentElement = cellController.element.parentElement;
    const elementColumn = Dom.getIndexOfElementInParent(cellController.element);

    switch(direction) {
      case CellController.NORTH:
        return (parentElement.previousSibling) ?
            parentElement.previousSibling.children[elementColumn].controller :
            null;
      case CellController.SOUTH:
        return (parentElement.nextSibling) ?
            parentElement.nextSibling.children[elementColumn].controller :
            null;
      case CellController.WEST:
        return (cellController.element.previousSibling) ?
            cellController.element.previousSibling.controller :
            null;
      case CellController.EAST:
        return (cellController.element.nextSibling) ?
            cellController.element.nextSibling.controller :
            null;
      default:
        throw new IllegalArgumentException('Unknown direction ' + direction);
    }
  }

  _on_navigate_north (origin) {
    const parentElement = origin.element.parentElement;
    const targetController = this.getRelativeCellController(origin, CellController.NORTH);

    if (targetController) {
      targetController.focus();

      // Prune empty rows at the bottom of the table
      if (parentElement.nextSibling === null &&
          Fn.all(this.model.getCellsInRow(this.model.height - 1), cell => cell.isEmpty())) {
        this.model.height --;
      }
    }
  }

  _on_navigate_south (origin) {
    const parentElement = origin.element.parentElement;

    // Expand the table if necessary
    if (parentElement.nextSibling === null) {
      this.model.height ++;
    }

    this.getRelativeCellController(origin, CellController.SOUTH).focus()
  }

  _on_navigate_newline (origin) {
    const parentElement = origin.element.parentElement;

    // Expand the table if necessary
    if (parentElement.nextSibling === null) {
      this.model.height ++;
    }

    parentElement.nextSibling.children[0].controller.focus();
  }

  _on_navigate_west (origin) {
    if (origin.element.previousSibling !== null) {
      this.getRelativeCellController(origin, CellController.WEST).focus();

      // Prune empty columns at the right edge of the table
      if (origin.element.nextSibling === null &&
          Fn.all(this.model.getCellsInColumn(this.model.width - 1), cell => cell.isEmpty())) {
        this.model.width --;
      }
    }
  }

  _on_navigate_east (origin) {
    if (origin.element.nextSibling === null) {
      this.model.width ++;

      // Make new column width match up with the previous one
      this.model.columns[this.model.width - 1].width =
          this.model.columns[this.model.width - 2].width;
    }

    this.getRelativeCellController(origin, CellController.EAST).focus();
  }

  _on_navigate_previous (origin) {
    // Select the last child of the previous row if necessary
    const parentElement = origin.element.parentElement;
    if (origin.element.previousSibling === null && parentElement.previousSibling !== null) {
      const parentPreviousSibling = parentElement.previousSibling;
      parentPreviousSibling.children[parentPreviousSibling.children.length - 1].controller.focus();
    }
    else {
      this._on_navigate_west(origin);
    }
  }

  _on_row_splice (change) {
    const index = change.index;
    const remove = change.remove;
    const insert = change.insert;

    // Remove old rows
    for (let i of Fn.range(remove)) {
      Dom.removeChildAtIndex(this.rowContainer, index + i);
    }

    // Insert new rows
    for (let i of Fn.range(insert)) {
      const row = this.model.getCellsInRow(index + i);
      const rowView = this._makeRowView(row);
      Dom.insertChildAtIndex(this.rowContainer, index + i, rowView);
    }
  }

  _on_column_splice (change) {
    const index = change.index;
    const remove = change.remove;
    const insert = change.insert;

    // Splice each row
    for (let r of Fn.range(this.model.height)) {
      const rowModel = this.model.data[r];
      const rowElement = this.rowContainer.children[r];

      // Remove old cells
      for (let i of Fn.range(remove)) {
        Dom.removeChildAtIndex(rowElement, index + i);
      }

      // Insert new cells
      for (let i of Fn.range(insert)) {
        const cell = rowModel[index + i];
        const column = this.model.columns[index + i];
        const cellController = this._makeCellController(cell, column);
        Dom.insertChildAtIndex(rowElement, index + i, cellController.element);
      }
    }
  }

  _on_cell_controller_focus(cellController) {
    this.focusedCellController = cellController;
  }

  _on_cell_controller_blur(cellController) {
    if (this.focusedCellController === cellController) {
      this.focusedCellController = null;
    }
  }

  get focused () { return this._focused; }

  set focused (_) {
    if (Boolean(this.focused) !== Boolean(_)) {
      if (_) {
        this._focused = true;
        this.element.classList.add('focused');
        this.notify(TableController.FOCUS, this);
      }
      else {
        this._focused = false;
        this.element.classList.remove('focused');
        this.focusedCellController = false;
        this.notify(TableController.BLUR, this);
      }
    }
  }

  focus () {
    this.rowContainer.children[0].children[0].controller.focus();
  }

  get focusedCellController () { return this._focusedCellController; }

  set focusedCellController (cellController) {
    if (this.focusedCellController !== cellController) {
      if (this.focusedCellController) {
        this.focusedCellController.focused = false;
        this._focusedCellController = null;
      }

      if (cellController) {
        this._focusedCellController = cellController;
        if (!this.focusedCellController.focused) {
          this.focusedCellController.focused = true;
        }
      }

      this.focused = Boolean(this.focusedCellController);
    }
  }

  /** Insert a row above the currently-focused cell **/
  insertRow () {
    if (this.focusedCellController) {
      const previouslyFocused = this.focusedCellController;
      const rowElement = this.focusedCellController.element.parentElement;
      const rowIndex = Dom.getIndexOfElementInParent(rowElement);

      this.model.spliceRows(rowIndex, 1, 0);

      // Move the focus to the new row
      this.getRelativeCellController(previouslyFocused, CellController.NORTH).focus();
    }
    else {
      throw Error('No cell is focused');
    }
  }

  /** Delete the row of the currently-focused cell **/
  deleteRow () {
    if (this.focusedCellController) {
      const focusNext =
          this.getRelativeCellController(this.focusedCellController, CellController.SOUTH) ||
          this.getRelativeCellController(this.focusedCellController, CellController.NORTH);

      const rowElement = this.focusedCellController.element.parentElement;
      const rowIndex = Dom.getIndexOfElementInParent(rowElement);

      this.model.spliceRows(rowIndex, 0, 1);

      focusNext.focus()
    }
    else {
      throw Error('No cell is focused');
    }
  }

  /** Insert a column to the left of the currently-focused cell **/
  insertColumn () {
    if (this.focusedCellController) {
      const previouslyFocused = this.focusedCellController;
      const cellElement = this.focusedCellController.element;
      const columnIndex = Dom.getIndexOfElementInParent(cellElement);

      this.model.spliceColumns(columnIndex, 1, 0);

      // Make the new column the same width as the old one
      this.model.columns[columnIndex].width =
          this.model.columns[columnIndex + 1].width;

      // Move the focus to the new column
      this.getRelativeCellController(previouslyFocused, CellController.WEST).focus();
    }
    else {
      throw Error('No cell is focused');
    }
  }

  /** Delete the column of the currently-focused cell **/
  deleteColumn () {
    if (this.focusedCellController) {
      const focusNext =
          this.getRelativeCellController(this.focusedCellController, CellController.EAST) ||
          this.getRelativeCellController(this.focusedCellController, CellController.WEST);

      const cellElement = this.focusedCellController.element;
      const columnIndex = Dom.getIndexOfElementInParent(cellElement);
      this.model.spliceColumns(columnIndex, 0, 1);

      focusNext.focus()
    }
    else {
      throw Error('No cell is focused');
    }
  }
}

module.exports = TableController;
