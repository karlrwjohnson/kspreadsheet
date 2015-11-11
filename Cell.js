'use strict';

const CELL_VALUE = Symbol('CELL_VALUE');

class Cell extends Observable {
  constructor (json) {
    super([CELL_VALUE]);

    if (json) {
      this.value = json.value;
    } else {
      this.value = '';
    }
  }

  toJSON () {
    return {
      value: this.value
    }
  }

  get value () { return this._value; }

  set value (_) {
    this._value = _;
    this.notify(CELL_VALUE);
  }

  isEmpty () {
    return this._value === '';
  }
}

describe('Cell', ()=>{
  let cell;

  beforeEach(()=>{
    cell = new Cell({value: 'asdf'});
  });

  it('should initialize from serialized data', ()=>{
    expect(cell.value).toBe('asdf');
  });

  it('should initialize with a default value', ()=>{
    expect((new Cell()).value).toBe('');
  });

  it('should serialize', ()=>{
    expect(cell.toJSON()).toEqual({
      value: 'asdf'
    });
  });

  it('should get and set its value', ()=>{
    cell.value = 'qwer';
    expect(cell.value).toBe('qwer');
  });

  it('should notify about changes to its value', ()=>{
    const observer = jasmine.createSpy('on_value');
    cell.observe(CELL_VALUE, observer);
    cell.value = 'qwer';
    expect(observer).toHaveBeenCalled();
  });

  it('should say when it is empty', ()=>{
    cell.value = 'asdf';
    expect(cell.isEmpty()).toBeFalsy();
    cell.value = '';
    expect(cell.isEmpty()).toBeTruthy();
  })
});
