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
      Dom.div({'class': 'toolbar'},
        this._fileLoader.element,
        this.openWorksheetButton = Dom.button({id: 'openWorksheet', class: 'toolbarButton', title: 'Open Worksheet', }, Dom.img({src: 'img/open.svg'})),
        Dom.hr(),
        this.deleteTableButton   = Dom.button({id: 'deleteTable',   class: 'toolbarButton', title: 'Delete Table',   }, Dom.img({src: 'img/deleteTable.svg'})),
        Dom.hr(),
        this.insertColumnButton  = Dom.button({id: 'insertColumn',  class: 'toolbarButton', title: 'Insert Column',  }, Dom.img({src: 'img/insertColumn.svg'})),
        this.insertRowButton     = Dom.button({id: 'insertRow',     class: 'toolbarButton', title: 'Insert Row',     }, Dom.img({src: 'img/insertRow.svg'})),
        this.deleteColumnButton  = Dom.button({id: 'deleteColumn',  class: 'toolbarButton', title: 'Delete Column',  }, Dom.img({src: 'img/deleteColumn.svg'})),
        this.deleteRowButton     = Dom.button({id: 'deleteRow',     class: 'toolbarButton', title: 'Delete Row',     }, Dom.img({src: 'img/deleteRow.svg'}))
      ),
      this.tableContainer = Dom.div({id: 'tableContainer', 'class': 'worksheet flex-grow'})
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
