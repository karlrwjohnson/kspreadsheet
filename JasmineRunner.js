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

const ANSIColors = Object.freeze({
  RED: '\u001b[31m',
  GREEN: '\u001b[32m',
  YELLOW: '\u001b[33m',
  BLUE: '\u001b[34m',
  RESET: '\u001b[0m',
});

/**
 * Produces versions of jasmineEnv.it(), beforeEach(), etc that support async
 * execution using generators.
 */
function generatorShimFactory (jasmineFunction) {
  return function generatorShim (...args) {
    // Variadic arguments generalize the signatures of it() and before/after-
    // Each/All(). While it() takes the name of the test as well as a function,
    // the latter only take the function.
    const spec = args.pop();

    // ES6 intentionally makes it difficult to differentiate a generator from
    // a normal function (Function.prototype.isGenerator() is non-standard and
    // specific to Mozilla's implementation) because generators are supposed to
    // be indistinguishable from other iterators.
    //   But since we're abusing generators as async functions, we don't want to
    // treat generators like another kind of iterator.
    if (spec.constructor.name === 'GeneratorFunction') {
      jasmineFunction(...args, done => {
        const itr = spec();
        function processIterator (previousValue) {
          const next = itr.next(previousValue);
          if (next.done) {
            done();
          }
          else if ('then' in next.value) {
            next.value.then(resolvedValue => {
              try {
                processIterator(resolvedValue)
              }
              catch(e) {
                console.error(e.stack);
                done();
              }
            });
          }
          else {
            processIterator();
          }
        }
        processIterator(undefined);
      });
    }
    else {
      // Normal functions fall back to the original behavior.
      jasmineFunction(...args, spec);
    }
  };
}

module.exports = Object.seal({

  jasmineCore: jasmineCore,
  jasmineEnv:  jasmineEnv,

  it:          generatorShimFactory(jasmineEnv.it),
  beforeEach:  generatorShimFactory(jasmineEnv.beforeEach),
  afterEach:   generatorShimFactory(jasmineEnv.afterEach),
  beforeAll:   generatorShimFactory(jasmineEnv.beforeAll),
  afterAll:    generatorShimFactory(jasmineEnv.afterAll),

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
    // typedef spec {
    //   id: string (e.g. 'spec53'),
    //   description: string,
    //   fullName: string (= suite.name + $.description),
    //   failedExpectations: [{
    //     matcherName: string (e.g. 'toEqual')
    //     message: string (= Error.message),
    //     stack: string (= Error.stack),
    //     passed: boolean (= false),
    //     expected: value,
    //     actual: value
    //   }],
    //   passedExpectations: (as failedExpectations),
    //   pendingReason: string,
    //   status: string (= 'failed', ?),
    // }
    try {
      if (spec.failedExpectations.length) {
        console.info(`${ANSIColors.RED}✗ ${spec.fullName} (${spec.failedExpectations.length} failures)${ANSIColors.RESET}`);
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
          if (failure.matcherName === '') {
            console.log('   - ' + failure.message);
          }
          else {
            console.log('   - Expected' +
              (actualRepr.indexOf('\n') >= 0 ?
                ':\n       ' + actualRepr.replace(/\n/g, '\n       ') + '\n     ' :
                ' ' + actualRepr + ' '
              ) +
              failure.matcherName +
              (expectedRepr.indexOf('\n') >= 0 ?
                ':\n       ' + expectedRepr.replace(/\n/g, '\n        ') :
                ' ' + expectedRepr)
            );
          }
          console.log(failure.stack);
        }
        //console.log(spec);
      }
      else {
        console.log(`${ANSIColors.GREEN}✓ ${spec.fullName}${ANSIColors.RESET}`)
      }
    } catch(e) {
      console.log(e.stack);
    }
  },

  _currentSpecDir: null,

  /**
   * Delegates to require(), taking into account the relative position of
   * JasmineRunner from the test being run.
   */
  _fakeRequire (requirePath) {
    return require('./' + path.join(this._currentSpecDir, requirePath));
  },

  /**
   * Delegates to require.resolve(), taking into account the relative position
   * of JasmineRunner from the test being run.
   */
  _fakeResolve(resolvePath) {
    return require.resolve('./' + path.join(this._currentSpecDir, resolvePath));
  },

  /**
   * Creates a sandbox object in which to run tests.
   *
   * To use Jasmine environment functions as globals, I rolled my own module
   * system that loads files manually and runs them in a child VM context.
   *
   * It was a lot of effort when I could have just had the specs require()
   * this file, but now that it's done I'm not going back.
   */
  _sandboxFactory () {
    // Make the child context inherit from this one so the child has the same
    // globals. Otherwise, the child receives brand-new global objects, which
    // breaks `instanceof` and by extension the `jasmine.any` matcher.
    const sandbox = Object.create(global);

    // Apparently, the require() function doesn't come for free in the child
    // context.
    sandbox.require = this._fakeRequire.bind(this);
    sandbox.require.resolve = this._fakeResolve.bind(this);

    // Inject Jasmine object
    sandbox.jasmine = jasmineCore;

    // Inject Jasmine environment globals
    for (let property in jasmineEnv) {
      //noinspection JSUnfilteredForInLoop
      sandbox[property] = jasmineEnv[property];
    }

    // Replace Jasmine environment functions with our custom shims
    sandbox.it = this.it;
    sandbox.beforeEach = this.beforeEach;
    sandbox.afterEach = this.afterEach;
    sandbox.beforeAll = this.beforeAll;
    sandbox.afterAll = this.afterAll;

    return sandbox;
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
      // Tell _fakeRequire() and _fakeResolve() the relative path to the spec
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
