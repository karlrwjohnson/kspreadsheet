'use strict';

const ui_test = require('../ui-test');

describe('KSpreadsheet', () => {

  beforeEach(done => {
    ui_test.client.init().then(() => {
      console.log('Initialized session');
      done();
    });
  });
  afterEach(done => {
    ui_test.client.end().then(() => {
      console.log('Terminated session');
      done()
    });
  });

  it('should say the name of the application in the title bar', function* () {
    expect(yield ui_test.client.getTitle()).toBe('KSpreadsheet');
    //yield ui_test.anyKey();
  });

  it('should auto-load a sample spreadsheet', function*() {
    yield ui_test.client.element('input')
      .then((...args) => {
        console.log(...args);
        debugger;
      });
  });

  //it('should say the name of the application in the title bar', function (done) {
  //  console.log('starting test');
  //  ui_test.client.getTitle().then(title => {
  //    console.log('Got title');
  //    expect(title).toBe('KSpreadsheet');
  //    console.log('hi');
  //    done();
  //  });
  //});
});
