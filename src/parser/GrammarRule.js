'use strict';

const RuleState = require('./RuleState');

/**
 * A rule defining a language, i.e. Value -> int or Expression -> Value + Value
 */
module.exports =
class GrammarRule {
  constructor (subject, predicate, reductionFn) {
    this.subject = subject;
    this.predicate = Object.freeze(predicate);
    this.reductionFn = reductionFn;

    this.firstState = new RuleState(this, 0);

    this._toString = this.subject + ' → ' + this.predicate.join(' ');

    Object.freeze(this);
  }

  toString() {
    return this._toString;
  }
};
