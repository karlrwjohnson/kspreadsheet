'use strict';

//require('init-jasmine').applyEnvironment(global);

const Cell = require('../Cell');

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
    cell.observe(Cell.VALUE, observer);
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
