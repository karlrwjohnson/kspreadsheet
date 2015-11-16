'use strict';

const CREATE_TABLE_BUTTON = 0;

class DocumentController {
  
  constructor (document) {
    bindObservers(this);

    this.tableControllers = new Map();
    this._focusedTable = null;

    this._document_observers = [];
    this.element = Dom.div({'class': 'document-root flex-column flex-grow'},
      this.toolbarContainer = Dom.nav({'class': 'toolbar'},
        this.deleteTableButton = Dom.button('Delete Table'),
        this.insertColumnButton = Dom.button({title: 'Insert Column'}, Dom.img({href: 'img/insertColumn.svg'}), 'Insert Column'),
        this.deleteColumnButton = Dom.button({title: 'Delete Column'}, Dom.img({href: 'img/deleteColumn.svg'}), 'Delete Column'),
        this.insertRowButton = Dom.button({title: 'Insert Row'}, Dom.img({href: 'img/insertRow.svg'}), 'Insert Row'),
        this.deleteRowButton = Dom.button({title: 'Delete Row'}, Dom.img({href: 'img/deleteRow.svg'}), 'Delete Row')
      ),
      this.tableContainer = Dom.div({'class': 'document flex-grow'})
    );

    this.tableContainer.addEventListener('click', this._on_click);
    this.tableContainer.addEventListener('dblclick', this._on_dbl_click);
    this.deleteTableButton.addEventListener('click', () => {})

    this.deleteTableButton.addEventListener('click', () => {
      this.document.removeTable(this.focusedTable.model);
      this.focusedTable = null;
    });
    this.insertColumnButton.addEventListener('click', () => this.focusedTable.insertColumn());
    this.deleteColumnButton.addEventListener('click', () => this.focusedTable.deleteColumn());
    this.insertRowButton.addEventListener('click', () => this.focusedTable.insertRow());
    this.deleteRowButton.addEventListener('click', () => this.focusedTable.deleteRow());

    this.document = document;
  }

  get document () {
    return this._document;
  }

  set document (_) {
    let observer;
    while ((observer = this._document_observers.pop())) {
      observer.cancel();
    }

    this._document = _;

    this._document_observers.push(this.document.observe(DOCUMENT_ADD_TABLE, this._on_addTable));
    this._document_observers.push(this.document.observe(DOCUMENT_REMOVE_TABLE, this._on_removeTable));

    for (let table of this.document.tables) {
      this._on_addTable(table);
    }
  }

  _on_addTable(table) {
    const tableController = new TableController(table);
    this.tableControllers.set(table, tableController);
    tableController.observe(TABLE_CONTROLLER_EMPTY_BLUR, this._on_table_controller_empty_blur);
    tableController.observe(TABLE_CONTROLLER_FOCUS, this._on_table_controller_focus);
    tableController.observe(TABLE_CONTROLLER_BLUR, this._on_table_controller_blur);
    this.tableContainer.appendChild(tableController.element);
    tableController.focus();
  }

  _on_removeTable(table) {
    const tableController = this.tableControllers.get(table);
    if (this.focusedTable === tableController) {
      this.focusedTable = null;
    }
    this.tableContainer.removeChild(tableController.element);
    this.tableControllers.delete(table);
  }

  _on_click(evt) {
    if (evt.target === this.tableContainer) {
      this.focusedTable = null;
    }
  }

  _on_dbl_click(evt) {
    console.log('_on_dbl_click', evt);
    if (evt.target === this.tableContainer) {
      console.log(evt);
      if (evt.buttons === CREATE_TABLE_BUTTON) {
        const emSize = getEmSize(this.tableContainer);
        const em_x = Math.round(evt.offsetX / emSize);
        const em_y = Math.round(evt.offsetY / emSize);
        const newTable = new Table();
        newTable.position = [em_x, em_y];
        this.document.addTable(newTable);
      }
    }
  }

  _on_table_controller_empty_blur(table) {
    console.log('Can remove table');
  }

  _on_table_controller_focus(table) {
    this.focusedTable = table;
  }

  _on_table_controller_blur(table) {
    if (this.focusedTable === table) {
      this.focusedTable = null;
    }
  }

  get focusedTable () { return this._focusedTable; }

  set focusedTable (table) {
    if (this.focusedTable !== table) {
      if (this.focusedTable) {
        this.focusedTable.focused = false;
        this._focusedTable = null;
      }

      if (table) {
        this._focusedTable = table;
        this.focusedTable.focused = true;
      }

      for (let button of [
          this.deleteTableButton,
          this.insertColumnButton,
          this.deleteColumnButton,
          this.insertRowButton,
          this.deleteRowButton,
      ]) {
        button.disabled = !table;
      }
    }
  }
}
