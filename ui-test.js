'use strict';

const webdriverio = require('webdriverio');
const JasmineRunner = require('./JasmineRunner');

const options = {
  desiredCapabilities: {
    // Any options not related to Chrome specifically is described at:
    // https://code.google.com/p/selenium/wiki/DesiredCapabilities

    browserName: 'chrome',
    chromeOptions: {
      // Options available here are listed at:
      // https://sites.google.com/a/chromium.org/chromedriver/capabilities

      // Dashes are automatically prepended to each flag
      args: [
        // Path to package.json directory, since we can't pass non-option params
        // https://github.com/nwjs/nw.js/pull/3319#issuecomment-161318720
        'nwapp=.'
      ],

      // Path to nw executable
      binary: 'nwjs/nw'
    }
  },
};

const client = webdriverio.remote(options);

module.exports = Object.freeze({
  client: client,

  anyKey () {
    console.log('*** Press any key to continue ***');
    return new Promise((resolve, reject) => {
      process.stdin.once('data', (data) => resolve(data));
    });
  }
});

//JasmineRunner.jasmineEnv.beforeEach(() => {
//  client.init();
//});
//
//JasmineRunner.jasmineEnv.afterEach(() => {
//  client.end();
//});

//JasmineRunner.jasmineCore.DEFAULT_TIMEOUT_INTERVAL = 10000;
JasmineRunner.jasmineCore.DEFAULT_TIMEOUT_INTERVAL = 10000000;

//JasmineRunner.run('./uitest');

client.init().element('input').then((...args) => {

  debugger;
  client.end();
});

