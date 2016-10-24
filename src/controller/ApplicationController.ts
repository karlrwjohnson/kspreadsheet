'use strict';

import bindObservers from '../util/bindObservers';
import * as Dom from '../util/dom';
import FileLoader from './FileLoader';
import FileSaver from './FileSaver';
import Worksheet from '../model/Worksheet';
import WorksheetController from './WorksheetController';

export default class ApplicationController {

  _fileLoader: FileLoader = new FileLoader();
  _fileSaver: FileSaver = new FileSaver();

  element: HTMLElement;
  worksheetController: WorksheetController;

  deleteTable: HTMLButtonElement;
  insertColumn: HTMLButtonElement;
  insertRow: HTMLButtonElement;
  deleteColumn: HTMLButtonElement;
  deleteRow: HTMLButtonElement;

  constructor () {
    bindObservers(this);

    this.worksheetController = new WorksheetController(new Worksheet());

    this.element = Dom.div({'id': 'app-root', 'class': 'app-root flex-column'},
      this._fileLoader.element,
      this._fileSaver.element,

      Dom.div({'class': 'toolbar'},
        Dom.button({
          id: 'newWorksheet',
          class: 'toolbarButton',
          title: 'New Worksheet',
          onclick: () => this.worksheetController.worksheet = new Worksheet()
        }, Dom.img({src: 'img/new.svg'})),

        Dom.button({
          id: 'openWorksheet',
          class: 'toolbarButton',
          title: 'Open Worksheet',
          onclick: () => this._fileLoader.prompt()
            .then(contents => {
              let spec;
              try {
                spec = JSON.parse(contents);
              }
              catch (e) {
                console.error(e);
                throw new Error(
                  `File appears to be corrupt, as there was ` +
                  `a syntax error while trying to parse it as JSON (${e.message})`
                );
              }
              this.worksheetController.worksheet = new Worksheet(spec);
            })
            .catch(e => {
              console.error(e);
              alert(e.message);
            })
        }, Dom.img({src: 'img/open.svg'})),

        Dom.button({
          id: 'saveWorksheet',
          class: 'toolbarButton',
          title: 'Save Worksheet',
          onclick: () => this._fileSaver
            .prompt(JSON.stringify(this.worksheetController.worksheet.toJSON()))
            .catch(e => {
              console.error(e);
              alert(e.message);
            })
        }, Dom.img({src: 'img/save.svg'})),

        Dom.hr(),

        this.deleteTable = Dom.button({
          id: 'deleteTable',
          class: 'toolbarButton',
          title: 'Delete Table',
          onclick: () => this.worksheetController.worksheet.removeTable(this.worksheetController.focusedTable.model)
        }, Dom.img({src: 'img/deleteTable.svg'})),

        Dom.hr(),

        this.insertColumn = Dom.button({
          id: 'insertColumn',
          class: 'toolbarButton',
          title: 'Insert Column',
          onclick: () => this.worksheetController.focusedTable.insertColumn()
        }, Dom.img({src: 'img/insertColumn.svg'})),

        this.insertRow = Dom.button({
          id: 'insertRow',
          class: 'toolbarButton',
          title: 'Insert Row',
          onclick: () => this.worksheetController.focusedTable.insertRow()
        }, Dom.img({src: 'img/insertRow.svg'})),

        this.deleteColumn = Dom.button({
          id: 'deleteColumn',
          class: 'toolbarButton',
          title: 'Delete Column',
          onclick: () => this.worksheetController.focusedTable.deleteColumn()
        }, Dom.img({src: 'img/deleteColumn.svg'})),

        this.deleteRow = Dom.button({
          id: 'deleteRow',
          class: 'toolbarButton',
          title: 'Delete Row',
          onclick: () => this.worksheetController.focusedTable.deleteRow()
        }, Dom.img({src: 'img/deleteRow.svg'}))
      ),
      this.worksheetController.element
    );

    this.worksheetController.observe(WorksheetController.CELL_FOCUS, this._on_cell_focus);
  }

  _on_cell_focus (focused) {
    for (let button of [
        this.deleteTable,
        this.insertColumn,
        this.deleteColumn,
        this.insertRow,
        this.deleteRow,
    ]) {
      button.disabled = !focused;
    }

  }
}
