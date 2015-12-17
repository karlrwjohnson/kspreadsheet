'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const vm = require('vm');

const Fn = require('./src/util/Fn');
const Filesystem = require('./src/util/Filesystem');

const jasmine = require('jasmine-core/lib/jasmine-core/jasmine');

const REPORT_RECURSION_DEPTH = 1;
const REPORT_USE_COLORS = true;

// Corresponds to the `jasmine` object exported by the in-browser library
// Includes, among other things, the createSpy() method
const jasmineCore = jasmine.core(jasmine);

// Contains values intended to be be declared as globals, such as describe() and
// it()
const jasmineEnv = jasmineCore.getEnv();

module.exports = Object.seal({

  _currentSpecDir: null,

  jasmineCore: jasmineCore,
  jasmineEnv: jasmineEnv,

  // Default Reporters
  onJasmineStarted () {
    //console.log('jasmineStarted: ', arguments);
  },
  onJasmineDone () {
    //console.log('jasmineDone: ', arguments);
    console.log('Unit Tests Complete');
  },
  onSuiteStarted () {
    //console.log('suiteStarted: ', arguments);
  },
  onSuiteDone () {
    //console.log('suiteDone: ', arguments);
  },
  onSpecStarted () {
    //console.log('specStarted: ', arguments);
  },
  onSpecDone (spec) {
    /*  typedef spec {
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
        //console.log(spec);
      }
    } catch(e) {
      console.log(e.stack);
    }
  },

  /**
   * Creates a sandbox object in which to run tests
   */
  _sandboxFactory () {
    const that = this;
    /* To use Jasmine environment functions as globals, I rolled my own module
     * system that loads files manually and runs them in a child VM context.
     *
     * This is non-trivial, however.
     *
     * - require() doesn't exist in the child context by default for some reason,
     *   and probably so are lot of other NodeJS globals. So, I have to patch it
     *   in manually, taking care to account for the relative path
     *
     * - I thought I needed to implement require.resolve to make injectRequire.js
     *   work, but it turns out I didn't because sub-require()'ed modules get
     *   the original require() object, so I didn't need
     *
     * - Unless I do something about it, the child context gets ITS OWN COPIES
     *   of String, Object, and all the other globals. Great for security, but
     *   it breaks `instanceof`, and by extension, the `jasmine.any` matcher.
     *   We can override the copies with the original globals by making the
     *   sandbox's prototype be `global`
     */

    // Give child context access to the same global instances as Jasmine
    const sandboxObject = Object.create(global);

    // Patch-in the require() function
    sandboxObject.require = function fakeRequire(requirePath) {
      const newPath = './' + path.join(that._currentSpecDir, requirePath);
      return require(newPath);
    };
    sandboxObject.require.resolve = function fakeResolve(resolvePath) {
      return require.resolve('./' + path.join(that._currentSpecDir, resolvePath));
    };

    // Inject Jasmine object
    sandboxObject.jasmine = jasmineCore;

    // Inject Jasmine environment globals
    for (let property in jasmineEnv) {
      //noinspection JSUnfilteredForInLoop
      sandboxObject[property] = jasmineEnv[property];
    }

    return sandboxObject;
  },

  /**
   * Look for specs in `testRoot` and run them.
   *
   * @param testRoot {String} Path containing *Spec.js files
   */
  run (testRoot) {
    jasmineEnv.addReporter({
      jasmineStarted: this.onJasmineStarted,
      jasmineDone: this.onJasmineDone,
      suiteStarted: this.onSuiteStarted,
      suiteDone: this.onSuiteDone,
      specStarted: this.onSpecStarted,
      specDone: this.onSpecDone,
    });

    const sandbox = this._sandboxFactory();

    for (let specPath of Filesystem.find(testRoot, name => name.endsWith('Spec.js'))) {
      this._currentSpecDir = path.dirname(specPath);
      vm.runInNewContext(
        fs.readFileSync(specPath),  // code
        Object.create(sandbox),     // context
        {                           // options
          filename: require.resolve('./' + specPath),
        }
      );
    }

    jasmineEnv.execute();
  },
});
