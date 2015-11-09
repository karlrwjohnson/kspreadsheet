'use strict';

const COLUMN_WIDTH = Symbol('COLUMN_WIDTH');

class Column extends Observable {
  constructor (width) {
    super([COLUMN_WIDTH]);
    this._width = width;
  }

  get width () { return this._width; }

  set width (_) {
    if (_ > 0) {
      this._width = _;
      this.notify(COLUMN_WIDTH);
    }
    else {
      throw new OutOfBoundsException();
    }
  }
}

describe('Column', ()=>{
  const defaultWidth = 10;

  let column;

  beforeEach(()=>{
    column = new Column(defaultWidth);
  });

  it('should initialize its width on construction', ()=>{
    expect(column.width).toBe(defaultWidth);
  });

  it('should get and set its width', ()=>{
    column.width = 20;
    expect(column.width).toBe(20);
  });

  it('should prevent negative widths', ()=>{
    expect(() => column.width = -1).toThrow();
  });

  it('should notify about changes to its width', ()=>{
    const observer = jasmine.createSpy('on_width');
    column.observe(COLUMN_WIDTH, observer);
    column.width = 20;
    expect(observer).toHaveBeenCalled();
  });
});
