'use strict';

const Fn = require('../util/Fn');
const ReduceReduceConflictError = require('./ReduceReduceConflictError');

module.exports =
class ParserState {
  constructor (ruleStates) {
    this.nextStateForToken = new Map();
    this.ruleStates = ruleStates;

    // Add reduction rule, if applicable
    const terminalRuleStates = Array.from(Fn.filter(
      ruleStates,
      ruleState => ruleState.token === null
    ));

    if (terminalRuleStates.length === 0) {
      this.reduction = null;
    }
    else if (terminalRuleStates.length === 1) {
      this.reduction = terminalRuleStates[0].rule;
    }
    else if (terminalRuleStates.length > 1) {
      throw new ReduceReduceConflictError(
        'Multiple reductions possible for state:\n\t' +
        terminalRuleStates.join('\n\t')
      );
    }

    Object.freeze(this);
  }

  toString () {
    return (this.reduction ? `REDUCE ${this.reduction}\n` : '') +
      Array.from(this.ruleStates).join('\n');
  }

  equals (other) {
    return Fn.setsAreEqual(this.ruleStates, other.ruleStates);
  }
};
