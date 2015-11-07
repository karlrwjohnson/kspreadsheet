'use strict';

const TABLE_MOVE_BUTTON = 1;

class TableController {
  constructor (model) {
    bindObservers(this);

    this._model_observers = [];
    this.element = Dom.table(
      this.columnContainer = Dom.colgroup(),
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
    removeChildren(this.columnContainer);
    removeChildren(this.rowContainer);

    this._model = _;

    // Create DOM for columns
    for (let column of this.model.columns) {
      const columnController = new ColumnController(column);
      this.columnContainer.appendChild(columnController.element);
    }

    // Create DOM for rows
    for (let r of Fn.range(this.model.height)) {
      const rowView = this._makeRowView(this.model.getCellsInRow(r));
      this.rowContainer.appendChild(rowView);
    }

    // Add new observers
    this._model_observers.push(this.model.observe('position', this._on_position));
    this._model_observers.push(this.model.observe('spliceRows', this._on_row_splice));
    this._model_observers.push(this.model.observe('spliceColumns', this._on_column_splice));

    // Init properties
    this._on_position();
  }

  focus () {
    this.rowContainer.children[0].children[0].controller.focus();
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
    cellController.observe(NORTH, this._on_focus_north);
    cellController.observe(SOUTH, this._on_focus_south);
    cellController.observe(EAST, this._on_focus_east);
    cellController.observe(WEST, this._on_focus_west);
    return cellController;
  }

  _on_position () {
    const position = this.model.position;
    this.element.setAttribute('style', `left:${position[0]}em;top:${position[1]}em;`)
  }

  _on_focus_north (origin) {
    const parentElement = origin.element.parentElement;
    const previousRow = parentElement.previousSibling;
    if (previousRow !== null) {
      const elementColumn = Fn.indexOf(parentElement.children, origin.element);
      if (parentElement.nextSibling === null &&
          Fn.all(this.model.getCellsInRow(this.model.height - 1), cell => cell.isEmpty())) {
        this.model.height --;
      }
      previousRow.children[elementColumn].controller.focus();
    }
  }

  _on_focus_south (origin) {
    const parentElement = origin.element.parentElement;
    const elementColumn = Fn.indexOf(parentElement.children, origin.element);
    if (parentElement.nextSibling === null) {
      this.model.height ++;
    }
    parentElement.nextSibling.children[elementColumn].controller.focus();
  }

  _on_focus_east (origin) {
    if (origin.element.nextSibling === null) {
      this.model.width ++;
    }
    origin.element.nextSibling.controller.focus();
  }

  _on_focus_west (origin) {
    if (origin.element.previousSibling !== null) {
      origin.element.previousSibling.controller.focus();

      if (origin.element.nextSibling === null &&
          Fn.all(this.model.getCellsInColumn(this.model.width - 1), cell => cell.isEmpty())) {
        this.model.width --;
      }
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

    // Remove old columns
    for (let i of Fn.range(remove)) {
      removeChildAtIndex(this.columnContainer, index + i);
    }

    // Insert new columns
    for (let i of Fn.range(insert)) {
      const column = this.model.columns[index + i];
      const columnController = new ColumnController(column);
      insertChildAtIndex(this.columnContainer, index + i, columnController.element);
    }

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
}
