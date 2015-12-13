'use strict';

/**
 * A position inside a GrammarRule, indicating how much of the rule has been
 * matched by a parser.
 */
module.exports =
class RuleState {
  constructor (rule, cursor) {
    this.rule = rule;
    this.cursor = cursor || 0;

    this.token = (this.cursor < this.rule.predicate.length) ?
      this.rule.predicate[this.cursor] :
      null;

    this.child = (this.token === null) ?
      null :
      new RuleState(this.rule, this.cursor + 1);

    this._toString = this.rule.subject + ' → ' + [].concat(
        this.rule.predicate.slice(0, this.cursor),
        ['▲'],
        this.rule.predicate.slice(this.cursor)
      ).join(' ');

    Object.freeze(this);
  }

  toString() {
    return this._toString;
  }
};
