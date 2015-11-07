'use strict';

const CREATE_TABLE_BUTTON = 0;

class DocumentController {
  
  constructor (document) {
    bindObservers(this);

    this._document_observers = [];
    this.element = Dom.main();

    this.element.addEventListener('click', this._on_click);

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

    this._document_observers.push(this.document.observe('addTable', this._on_addTable));
    this._document_observers.push(this.document.observe('removeTable', this._on_removeTable));
  }

  _on_addTable(table) {
    const tableController = new TableController(table);
    this.element.appendChild(tableController.element);
    tableController.focus();
  }

  _on_removeTable(table) {
    const tableController = new TableController(table);
    this.element.removeChild(tableController.element);
  }

  _on_click(evt) {
    if (evt.target === this.element) {
      console.log(evt);
      if (evt.buttons === CREATE_TABLE_BUTTON) {
        const emSize = getEmSize(this.element);
        const em_x = Math.round(evt.offsetX / emSize);
        const em_y = Math.round(evt.offsetY / emSize);
        //this.document.addTable(new Table([em_x, em_y]))
      }
    }
  }
}
