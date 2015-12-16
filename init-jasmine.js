'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const vm = require('vm');

const Fn = require('./src/util/Fn');
const Filesystem = require('./src/util/Filesystem');

const jasmine = require('jasmine-core/lib/jasmine-core/jasmine');

const SRC_ROOT = './src';
const REPORT_RECURSION_DEPTH = 1;
const REPORT_USE_COLORS = true;

const jasmineCore = jasmine.core(jasmine);
const jasmineEnv = jasmineCore.getEnv();

function inspectForReport (thing) {
  return util.inspect(thing,
    { depth: REPORT_RECURSION_DEPTH,
      colors: REPORT_USE_COLORS,
      showHidden: true,
    }
  );
}

//Symbol.prototype.inspect = function() { return this.name; };

jasmineEnv.addReporter({
  jasmineStarted: function() {
    //console.log('jasmineStarted: ', arguments);
  },
  jasmineDone: function() {
    //console.log('jasmineDone: ', arguments);
    console.log('Unit Tests Complete');
  },
  suiteStarted: function() {
    //console.log('suiteStarted: ', arguments);
  },
  suiteDone: function() {
    //console.log('suiteDone: ', arguments);
  },
  specStarted: function() {
    //console.log('specStarted: ', arguments);
  },
  specDone: function(spec) {
    /*
      spec: {
        id: string (e.g. 'spec53'),
        description: string,
        fullName: string (= suite.name + $.description),
        failedExpectations: [{
          matcherName: string (e.g. 'toEqual')
          message: string (= Error.message),
          stack: string (= Error.stack),
          passed: boolean (= false),
          expected: value,
          actual: value
        }],
        passedExpectations: (as failedExpectations),
        pendingReason: string,
        status: string (= 'failed', ?),
      }
    */
    try {
    //console.log('specDone: ', arguments);
    if (spec.failedExpectations.length) {
      console.info(`Failures in ${spec.fullName}:`);
      for (let failure of spec.failedExpectations) {
        const actualRepr = util.inspect(failure.actual,
          { depth: REPORT_RECURSION_DEPTH,
            colors: REPORT_USE_COLORS,
            showHidden: true,
          });
        const expectedRepr = util.inspect(failure.expected,
          { depth: REPORT_RECURSION_DEPTH,
            colors: REPORT_USE_COLORS,
            showHidden: true,
          });
        console.log(' - Expected' +
          (actualRepr.indexOf('\n') >= 0 ?
            ':\n     ' + actualRepr.replace(/\n/g, '\n     ') + '\n   ' :
            ' ' + actualRepr + ' ') +
          failure.matcherName +
          (expectedRepr.indexOf('\n') >= 0 ?
            ':\n     ' + expectedRepr.replace(/\n/g, '\n     ') :
            ' ' + expectedRepr));
        console.log(failure.stack);
      }
      console.log(spec);
    }
    } catch(e) {
      console.log(e.stack);
    }
  },
});


/**
 * Generator which searches
 */
function * getSpecs (pathname) {
  try {
    for (let filename of fs.readdirSync(pathname)) {
      for (let spec of getSpecs(path.join(pathname, filename))) {
        yield spec;
      }
    }
  }
  catch(e) {
    if ('code' in e && e.code === 'ENOTDIR') {
      if (pathname.endsWith('Spec.js')) {
        yield pathname;
      }
    }
    else {
      throw e;
    }
  }
}

//console.log('Found the following specs:');
//console.log(Array.from(getSpecs(SRC_ROOT)).join('\n'));

let currentPath = '.';

/* In order to keep using the Jasmine enviornment as globals,
 * I decided to run the unit tests in a child VM context.
 *
 * This caused a bit of trouble, though.
 * - require() doesn't exist in the child context by default for some reason,
 *   and a lot of other NodeJS globals are probably also missing... At least
 *   probably those related to modules. So, I have to patch it in manually.
 * - The child context gets ITS OWN COPIES of String, Object, and all the other
 *   variables. This breaks the jasmine.any custom matcher, which checks whether
 *   an object is an instance of a class. If we make the sandbox prototype from
 *   global, then all these globals will be given to the child context.
 */

const sandboxObject = Object.create(global);

sandboxObject.require = function fakeRequire(requirePath) {
  const newPath = './' + path.join(currentPath, requirePath);
  return require(newPath);
};
sandboxObject.require.resolve = function fakeResolve(resolvePath) {
  return require.resolve('./' + path.join(currentPath, resolvePath));
};
sandboxObject.jasmine = jasmineCore;

for (let property in jasmineEnv) {
  //noinspection JSUnfilteredForInLoop
  sandboxObject[property] = jasmineEnv[property];
}

const excludePaths = new Set([
  //'src/model/test/TableSpec.js',
]);

for (let specPath of Filesystem.find(SRC_ROOT, name => name.endsWith('Spec.js'))) {
  if (!excludePaths.has(specPath)) {
    currentPath = path.dirname(specPath);
    vm.runInNewContext(
      fs.readFileSync(specPath),  // code
      Object.create(sandboxObject),   // context
      {                           // options
        filename: require.resolve('./' + specPath),
      }
    );
  }
}

jasmineEnv.execute();

//module.exports = Object.freeze({
//  jasmineEnv: jasmineEnv,
//
//  applyEnvironment (global_) {
//    for (let i in this.jasmineEnv) {
//      global_[i] = this.jasmineEnv[i];
//    }
//  }
//});

