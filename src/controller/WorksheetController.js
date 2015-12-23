'use strict';

const bindObservers = require('../util/bindObservers');
const Dom = require('../util/Dom');
const FileLoader = require('./FileLoader');
const Fn = require('../util/Fn');
const GUIWindow = require('../util/GUIWindow');
const libview = require('../util/libview');
const Worksheet = require('../model/Worksheet');
const Table = require('../model/Table');
const TableController = require('./TableController');

const CREATE_TABLE_BUTTON = 0;

module.exports =
class WorksheetController {
  
  constructor (worksheet) {
    bindObservers(this);

    this.tableControllers = new Map();
    this._focusedTable = null;

    this._worksheet_observers = [];

    this._fileLoader = new FileLoader();

    this.element = Dom.div({'class': 'worksheet-root flex-column flex-grow'},
      this.toolbarContainer = Dom.nav({'class': 'toolbar'},
        this._fileLoader.element,
        this.openWorksheetButton = Dom.button('Open'),
        this.deleteTableButton = Dom.button('Delete Table'),
        this.insertColumnButton = Dom.button({title: 'Insert Column'}, Dom.img({href: 'img/insertColumn.svg'}), 'Insert Column'),
        this.deleteColumnButton = Dom.button({title: 'Delete Column'}, Dom.img({href: 'img/deleteColumn.svg'}), 'Delete Column'),
        this.insertRowButton = Dom.button({title: 'Insert Row'}, Dom.img({href: 'img/insertRow.svg'}), 'Insert Row'),
        this.deleteRowButton = Dom.button({title: 'Delete Row'}, Dom.img({href: 'img/deleteRow.svg'}), 'Delete Row')
      ),
      this.tableContainer = Dom.div({'class': 'worksheet flex-grow'})
    );

    this.openWorksheetButton.addEventListener('click', () => {
      this._fileLoader.prompt()
        .then(spec => {
          console.log('got ', spec);
          this.worksheet = new Worksheet(spec) })
        .catch(e => {
          console.error(e);
          GUIWindow.require('alert')(e.message);
        });
    });

    this.tableContainer.addEventListener('click', this._on_click);
    this.tableContainer.addEventListener('dblclick', this._on_dbl_click);
    this.deleteTableButton.addEventListener('click', () => {});

    this.deleteTableButton.addEventListener('click', () => {
      this.worksheet.removeTable(this.focusedTable.model);
      this.focusedTable = null;
    });
    this.insertColumnButton.addEventListener('click', () => this.focusedTable.insertColumn());
    this.deleteColumnButton.addEventListener('click', () => this.focusedTable.deleteColumn());
    this.insertRowButton.addEventListener('click', () => this.focusedTable.insertRow());
    this.deleteRowButton.addEventListener('click', () => this.focusedTable.deleteRow());

    this.worksheet = worksheet;
  }

  get worksheet () {
    return this._worksheet;
  }

  set worksheet (_) {
    let observer;
    while ((observer = this._worksheet_observers.pop())) {
      observer.cancel();
    }

    if (this._worksheet) {
      for (let table of this._worksheet.tables) {
        this._on_removeTable(table);
      }
    }

    this.focusedTable = null;

    this._worksheet = _;

    this._worksheet_observers.push(this.worksheet.observe(Worksheet.ADD_TABLE, this._on_addTable));
    this._worksheet_observers.push(this.worksheet.observe(Worksheet.REMOVE_TABLE, this._on_removeTable));

    for (let table of this.worksheet.tables) {
      this._on_addTable(table);
    }
  }

  _on_addTable(table) {
    const tableController = new TableController(table);
    this.tableControllers.set(table, tableController);
    tableController.observe(TableController.EMPTY_BLUR, this._on_table_controller_empty_blur);
    tableController.observe(TableController.FOCUS, this._on_table_controller_focus);
    tableController.observe(TableController.BLUR, this._on_table_controller_blur);
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
        const emSize = libview.getEmSize(this.tableContainer);
        const em_x = Math.round(evt.offsetX / emSize);
        const em_y = Math.round(evt.offsetY / emSize);
        const newTable = new Table();
        newTable.position = [em_x, em_y];
        this.worksheet.addTable(newTable);
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
};
