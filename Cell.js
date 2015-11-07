'use strict';

class Cell extends Observable {
  constructor (value) {
    super();
    this._value = value;
  }

  get value () { return this._value; }

  set value (_) {
    this._value = _;
    this.notify('value');
  }

  isEmpty () {
    return this._value === '';
  }
}

describe('Cell', ()=>{
  let cell;

  beforeEach(()=>{
    cell = new Cell('asdf');
  });

  it('should initialize its value on construction', ()=>{
    expect(cell.value).toBe('asdf');
  });

  it('should get and set its value', ()=>{
    cell.value = 'qwer';
    expect(cell.value).toBe('qwer');
  });

  it('should notify about changes to its value', ()=>{
    const observer = jasmine.createSpy('on_value');
    cell.observe('value', observer);
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
