'use strict';

const CREATE_TABLE_BUTTON = 0;

class DocumentController {
  
  constructor (document) {
    bindObservers(this);

    this.tables = new Set();
    this._selectedTable = null;

    this._document_observers = [];
    this.element = Dom.div({'class': 'document-root flex-column flex-grow'},
      this.toolbarContainer = Dom.nav({'class': 'toolbar'},
        this.deleteTableButton = Dom.button('Delete Table'),
        this.insertColumnButton = Dom.button({title: 'Insert Column'}, 'Insert Column'),
        this.deleteColumnButton = Dom.button({title: 'Delete Column'}, 'Delete Column'),
        this.insertRowButton = Dom.button({title: 'Insert Row'}, 'Insert Row'),
        this.deleteRowButton = Dom.button({title: 'Delete Row'}, 'Delete Row')
      ),
      this.tableContainer = Dom.div({'class': 'document flex-grow'})
    );

    this.tableContainer.addEventListener('dblclick', this._on_click);
    this.deleteTableButton.addEventListener('click', () => {})

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
  }

  _on_addTable(table) {
    this.tables.add(table);
    const tableController = new TableController(table);
    tableController.observe(TABLE_CONTROLLER_EMPTY_BLUR, this._on_table_controller_empty_blur);
    tableController.observe(TABLE_CONTROLLER_FOCUS, this._on_table_controller_focus);
    tableController.observe(TABLE_CONTROLLER_BLUR, this._on_table_controller_blur);
    this.tableContainer.appendChild(tableController.element);
    tableController.focus();
  }

  _on_removeTable(table) {
    this.tables.remove(table);
    this.tableContainer.removeChild(tableController.element);
  }

  _on_click(evt) {
    if (evt.target === this.tableContainer) {
      console.log(evt);
      if (evt.buttons === CREATE_TABLE_BUTTON) {
        const emSize = getEmSize(this.tableContainer);
        const em_x = Math.round(evt.offsetX / emSize);
        const em_y = Math.round(evt.offsetY / emSize);
        this.document.addTable(new Table([em_x, em_y]))
      }
    }
  }

  _on_table_controller_empty_blur(table) {
    console.log('Can remove table');
  }

  _on_table_controller_focus(table) {
    if (this.selectedTable !== null) {
      this.selectedTable.focused = false;
    }
    this._selectedTable = table;
  }

  _on_table_controller_blur(table) {
    if (this.selectedTable === table) {
     this._selectedTable = null;
    }
  }

  get selectedTable () { return this._selectedTable; }
}
