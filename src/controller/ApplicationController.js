'use strict';

const bindObservers = require('../util/bindObservers');
const Dom = require('../util/Dom');
const FileLoader = require('./FileLoader');
const GUIWindow = require('../util/GUIWindow');
const Worksheet = require('../model/Worksheet');
const WorksheetController = require('./WorksheetController');

module.exports =
class ApplicationController {
  constructor () {
    bindObservers(this);

    this._fileLoader = new FileLoader();
    this.worksheetController = new WorksheetController(new Worksheet());

    this.element = Dom.div({'id': 'app-root', 'class': 'app-root flex-column'},
      Dom.div({'class': 'toolbar'},
        this._fileLoader.element,
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
            .then(spec => {
              console.log('got ', spec);
              this.worksheetController.worksheet = new Worksheet(spec) })
            .catch(e => {
              console.error(e);
              GUIWindow.require('alert')(e.message);
            })
        }, Dom.img({src: 'img/open.svg'})),
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
};
