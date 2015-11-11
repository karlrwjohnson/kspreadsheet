'use strict';

const TABLE_MOVE_BUTTON = 1;

const TABLE_CONTROLLER_EMPTY_BLUR = Symbol('TABLE_CONTROLLER_EMPTY_BLUR');
const TABLE_CONTROLLER_FOCUS = Symbol('TABLE_CONTROLLER_FOCUS');
const TABLE_CONTROLLER_BLUR = Symbol('TABLE_CONTROLLER_BLUR');

class TableController extends Observable {
  constructor (model) {
    super([
      TABLE_CONTROLLER_EMPTY_BLUR,
      TABLE_CONTROLLER_FOCUS,
      TABLE_CONTROLLER_BLUR,
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

    new DiscreteDraggable(this.element, TABLE_MOVE_BUTTON,
        (dx, dy) => this.model.position = vecAdd(this.model.position, [dx, dy]));

    this.model = model;

  }

  get model () {
    return this._model;
  }

  set model (_) {
    // Remove old observers
    let observer;
    while ((observer = this._model_observers.pop())) {
      obsever.cancel();
    }

    // Remove old DOM
    removeChildren(this.rowContainer);

    this._model = _;

    // Create DOM for rows
    for (let r of Fn.range(this.model.height)) {
      const rowView = this._makeRowView(this.model.getCellsInRow(r));
      this.rowContainer.appendChild(rowView);
    }

    // Add new observers
    this._model_observers.push(this.model.observe(TABLE_POSITION, this._on_position));
    this._model_observers.push(this.model.observe(TABLE_SPLICE_ROWS, this._on_row_splice));
    this._model_observers.push(this.model.observe(TABLE_SPLICE_COLUMNS, this._on_column_splice));

    // Init properties
    this._on_position();
  }

  _makeRowView(modelRow) {
    const rowElement = Dom.tr();
    for (let cell_column of zip(modelRow, this.model.columns)) {
      const model_cell = cell_column[0]; // No destructuring assignment yet
      const column = cell_column[1];

      const cellController = this._makeCellController(model_cell, column);
      rowElement.appendChild(cellController.element);
    }
    return rowElement;
  }

  _makeCellController(modelCell, column) {
    const cellController = new CellController(modelCell, column);
    cellController.observe(NORTH, this._on_navigate_north);
    cellController.observe(SOUTH, this._on_navigate_south);
    cellController.observe(EAST, this._on_navigate_east);
    cellController.observe(WEST, this._on_navigate_west);
    cellController.observe(PREVIOUS, this._on_navigate_previous);
    cellController.observe(NEWLINE, this._on_navigate_newline);
    cellController.observe(CELL_CONTROLLER_FOCUS, this._on_cell_controller_focus);
    cellController.observe(CELL_CONTROLLER_BLUR, this._on_cell_controller_blur);
    return cellController;
  }

  _on_position () {
    const position = this.model.position;
    this.element.setAttribute('style', `left:${position[0]}em;top:${position[1]}em;`)
  }

  getRelativeCellController (cellController, direction) {
    const parentElement = cellController.element.parentElement;
    const elementColumn = getIndexOfElementInParent(cellController.element);

    switch(direction) {
      case NORTH:
        return (parentElement.previousSibling) ?
            parentElement.previousSibling.children[elementColumn].controller :
            null;
      case SOUTH:
        return (parentElement.nextSibling) ?
            parentElement.nextSibling.children[elementColumn].controller :
            null;
      case WEST:
        return (cellController.element.previousSibling) ?
            cellController.element.previousSibling.controller :
            null;
      case EAST:
        return (cellController.element.nextSibling) ?
            cellController.element.nextSibling.controller :
            null;
      default:
        throw new IllegalArgumentException('Unknown direction ' + direction);
    }
  }

  _on_navigate_north (origin) {
    const parentElement = origin.element.parentElement;
    const targetController = this.getRelativeCellController(origin, NORTH);

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

    this.getRelativeCellController(origin, SOUTH).focus()
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
      this.getRelativeCellController(origin, WEST).focus();

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

    this.getRelativeCellController(origin, EAST).focus();
  }

  _on_navigate_previous (origin) {
    // Select the last child of the previous row if necessary
    const parentElement = origin.element.parentElement;
    if (origin.element.previousSibling === null && parentElement.previousSibling !== null) {
      const parentPreviousSibling = parentElement.previousSibling
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
      removeChildAtIndex(this.rowContainer, index + i);
    }

    // Insert new rows
    for (let i of Fn.range(insert)) {
      const row = this.model.getCellsInRow(index + i);
      const rowView = this._makeRowView(row);
      insertChildAtIndex(this.rowContainer, index + i, rowView);
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
        removeChildAtIndex(rowElement, index + i);
      }

      // Insert new cells
      for (let i of Fn.range(insert)) {
        const cell = rowModel[index + i];
        const column = this.model.columns[index + i];
        const cellController = this._makeCellController(cell, column);
        insertChildAtIndex(rowElement, index + i, cellController.element);
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
        this.notify(TABLE_CONTROLLER_FOCUS, this);
      }
      else {
        this._focused = false;
        this.element.classList.remove('focused');
        this.focusedCellController = false;
        this.notify(TABLE_CONTROLLER_BLUR, this);
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
      const rowIndex = getIndexOfElementInParent(rowElement);

      this.model.spliceRows(rowIndex, 1, 0);

      // Move the focus to the new row
      this.getRelativeCellController(previouslyFocused, NORTH).focus();
    }
    else {
      throw Error('No cell is focused');
    }
  }

  /** Delete the row of the currently-focused cell **/
  deleteRow () {
    if (this.focusedCellController) {
      const focusNext =
          this.getRelativeCellController(this.focusedCellController, SOUTH) ||
          this.getRelativeCellController(this.focusedCellController, NORTH);

      const rowElement = this.focusedCellController.element.parentElement;
      const rowIndex = getIndexOfElementInParent(rowElement);

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
      const columnIndex = getIndexOfElementInParent(cellElement);

      this.model.spliceColumns(columnIndex, 1, 0);

      // Make the new column the same width as the old one
      this.model.columns[columnIndex].width =
          this.model.columns[columnIndex + 1].width;

      // Move the focus to the new column
      this.getRelativeCellController(previouslyFocused, WEST).focus();
    }
    else {
      throw Error('No cell is focused');
    }
  }

  /** Delete the column of the currently-focused cell **/
  deleteColumn () {
    if (this.focusedCellController) {
      const focusNext =
          this.getRelativeCellController(this.focusedCellController, EAST) ||
          this.getRelativeCellController(this.focusedCellController, WEST);

      const cellElement = this.focusedCellController.element;
      const columnIndex = getIndexOfElementInParent(cellElement);
      this.model.spliceColumns(columnIndex, 0, 1);

      focusNext.focus()
    }
    else {
      throw Error('No cell is focused');
    }
  }
}
