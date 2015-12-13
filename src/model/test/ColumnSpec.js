'use strict';

const Column = require('../Column');

describe('Column', ()=>{
  const defaultWidth = 16;

  let column;

  beforeEach(()=>{
    column = new Column({width: defaultWidth});
  });

  it('should initialize from serialized data', ()=>{
    expect(column.width).toBe(defaultWidth);
  });

  it('should initialize with default values', ()=>{
    expect((new Column()).width).toBe(10);

    // unit test default should be different from actual default for this test
    expect(defaultWidth).not.toBe(10);
  });

  it('should serialize', ()=>{
    expect(column.toJSON()).toEqual({
      width: defaultWidth
    });
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
    column.observe(Column.WIDTH, observer);
    column.width = 20;
    expect(observer).toHaveBeenCalled();
  });
});
