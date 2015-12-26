'use strict';

const bindObservers = require('../util/bindObservers');
const Dom = require('../util/Dom');
const libview = require('../util/libview');
const Observable = require('../util/Observable');
const Table = require('../model/Table');
const TableController = require('./TableController');
const Worksheet = require('../model/Worksheet');

const CREATE_TABLE_BUTTON = 0;

const CELL_FOCUS = Symbol('WorksheetController.CELL_FOCUS');


module.exports =
class WorksheetController extends Observable {

  static get CELL_FOCUS () { return CELL_FOCUS; }

  constructor (worksheet) {
    super([CELL_FOCUS]);
    bindObservers(this);

    this.tableControllers = new Map();
    this._focusedTable = null;

    this._worksheet_observers = [];

    this.element = Dom.div({id: 'tableContainer', 'class': 'worksheet flex-grow'},
      this.introMessage = Dom.div({id: 'introMessage', class: 'vertically-center fill-parent'},
        Dom.div({
          class: 'background-message',
          onclick: evt => evt.preventDefault(),
        }, 'Double-click anywhere to create a table')
      )
    );

    this.element.addEventListener('click', this._on_click);
    this.element.addEventListener('dblclick', this._on_dblclick);

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
    this.introMessage.style.display = '';

    this._worksheet = _;

    console.log(_);

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
    this.element.appendChild(tableController.element);
    tableController.focus();

    // Remove the intro message if a table has been added
    if (this.introMessage) {
      this.introMessage.style.display = 'none';
    }
  }

  _on_removeTable(table) {
    const tableController = this.tableControllers.get(table);
    if (this.focusedTable === tableController) {
      this.focusedTable = null;
    }
    this.element.removeChild(tableController.element);
    this.tableControllers.delete(table);
  }

  _on_click(evt) {
    if (evt.target === this.element) {
      this.focusedTable = null;
    }
  }

  _on_dblclick(evt) {
    console.log('_on_dblclick', evt);
    //if (evt.target === this.element) {
      console.log(evt);
      if (evt.buttons === CREATE_TABLE_BUTTON) {
        const emSize = libview.getEmSize(this.element);
        const em_x = Math.round(evt.offsetX / emSize);
        const em_y = Math.round(evt.offsetY / emSize);
        const newTable = new Table();
        newTable.position = [em_x, em_y];
        this.worksheet.addTable(newTable);
      }
    //}
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

      this.notify(CELL_FOCUS, !!table);
    }
  }
};
