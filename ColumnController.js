class ColumnController {
  constructor (column) {
    bindObservers(this);

    this._model_observer = null;
    this.element = Dom.col();

    this.column = column;
  }

  get column () { return this._column; }

  set column (_) {
    if (this._model_observer) {
      this._model_observer.cancel();
      this._model_observer = null;
    }

    this._column = _;

    if (this.column) {
      this._model_observer = this.column.observe('width', this._on_width);
    }

    this._on_width();
  }

  _on_width () {
    this.element.setAttribute('style', `width:${this.column.width}em;min-width:${this.column.width}em;`);
  }
}
