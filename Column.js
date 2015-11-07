'use strict';

class Column extends Observable {
  constructor (width) {
    super();
    this._width = width;
  }

  get width () { return this._width; }

  set width (_) {
    if (_ > 0) {
      this._width = _;
      this.notify('width');
    }
    else {
      throw new OutOfBoundsException();
    }
  }
}

describe('Column', ()=>{
  it('should initialize its width on construction', ()=>{
    const column = new Column(10);
    expect(column.width).toBe(10);
  });

  it('should get and set its width', ()=>{
    const cell = new Column(10);
    cell.width = 20;
    expect(cell.width).toBe(20);
  });

  it('should notify about changes to its width', ()=>{
    const cell = new Column(10);
    const observer = jasmine.createSpy('on_width');
    cell.observe('width', observer);
    cell.width = 20;
    expect(observer).toHaveBeenCalled();
  });
});
