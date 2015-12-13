'use strict';

const jasmine = require('jasmine-core/lib/jasmine-core/jasmine');

const jasmine_env = jasmine.core(jasmine).getEnv();

jasmine_env.addReporter({
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
    //console.log('specDone: ', arguments);
    if (spec.failedExpectations.length) {
      console.info(`Failures in ${spec.fullName}:`);
      for (let failure of spec.failedExpectations) {
        console.error(failure.stack);
        console.log(failure);
      }
      console.log(spec);
    }
  },
});

module.exports = {
  applyEnvironment (global_) {
    for (let i in jasmine_env) {
      global_[i] = jasmine_env[i];
    }
  }
};
