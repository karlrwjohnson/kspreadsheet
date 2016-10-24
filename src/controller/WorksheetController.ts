'use strict';

import { autoBindCallbacks } from '../util/ObserverTools';
import * as Dom from '../util/dom';
import { getEmSize } from '../util/libview';
import Observable from '../util/Observable';
import Table from '../model/Table';
import TableController from './TableController';
import Worksheet from '../model/Worksheet';
import {ObserveReceipt} from "../util/Observable";

const CREATE_TABLE_BUTTON = 0;

const CELL_FOCUS = Symbol('WorksheetController.CELL_FOCUS');

export default class WorksheetController extends Observable {

  static get CELL_FOCUS () { return CELL_FOCUS; }

  _focusedTable: TableController = null;
  _worksheet: Worksheet;
  _worksheet_observers: ObserveReceipt[] = [];

  element: HTMLElement;
  introMessage: HTMLDivElement;
  tableControllers: Map<Table, TableController> = new Map();

  constructor (worksheet: Worksheet) {
    super([CELL_FOCUS]);
    autoBindCallbacks(this);

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
    this.element.addEventListener('paste', this._on_paste);

    this.worksheet = worksheet;
  }

  get worksheet (): Worksheet {
    return this._worksheet;
  }

  set worksheet (_: Worksheet) {
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

    this._worksheet_observers.push(this.worksheet.observe(Worksheet.ADD_TABLE, this._on_addTable));
    this._worksheet_observers.push(this.worksheet.observe(Worksheet.REMOVE_TABLE, this._on_removeTable));

    for (let table of this.worksheet.tables) {
      this._on_addTable(table);
    }
  }

  _on_addTable(table: Table) {
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
    if (evt.buttons === CREATE_TABLE_BUTTON) {
      const emSize = getEmSize(this.element);
      const em_x = Math.round(evt.offsetX / emSize);
      const em_y = Math.round(evt.offsetY / emSize);
      const newTable = new Table();
      newTable.position = [em_x, em_y];
      this.worksheet.addTable(newTable);
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

  _on_paste (evt) {
    const pasteText = evt.clipboardData.getData('text');
    if (pasteText !== '') {
      evt.preventDefault();
      const tableData = pasteText
        .replace(/\r$|\r?\n$/, '')
        .split(/[\r\n]+/)
        .map(rowText => rowText.split('\t'));
      const newTable = new Table();
      newTable.height = tableData.length;
      newTable.width = tableData.map(row => row.length).reduce((a, b) => Math.max(a, b));
      tableData.forEach((rowData, r) =>
        rowData.forEach((cellData, c) =>
          newTable.getCell(r, c).value = cellData
        )
      );
      this.worksheet.addTable(newTable);
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
