'use strict';

import * as Fn from '../util/fn';
import Lexer       from './Lexer';
import Observable  from '../util/Observable';
import {LexerToken} from "./Lexer";

export const GRAMMAR_LOG = Symbol('GRAMMAR_LOG');
export const PARSE_LOG   = Symbol('PARSE_LOG');

export class GrammarError extends Error {}
export class ParseError extends Error {}
export class ReduceReduceConflictError extends GrammarError {}

/**
 * A position inside a GrammarRule, indicating how much of the rule has been
 * matched by a parser.
 */
class RuleState {
  rule: GrammarRule;
  cursor: number;
  token: string;
  child: RuleState;
  _toString: string;

  constructor (rule: GrammarRule, cursor: number) {
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
}

/**
 * A rule defining a language, i.e. Value -> int or Expression -> Value + Value
 */
export class GrammarRule {
  subject: string;
  predicate: string[];
  reductionFn: Function;

  firstState: RuleState;
  _toString: string;

  constructor (subject: string, predicate: string[], reductionFn: Function) {
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

class ParserState {
  nextStateForToken: Map<String, ParserState>;
  ruleStates: Iterable<RuleState>;
  reduction: GrammarRule;

  constructor (ruleStates: Iterable<RuleState>) {
    this.nextStateForToken = new Map();
    this.ruleStates = ruleStates;

    // Add reduction rule, if applicable
    const terminalRuleStates = Array.from(Fn.ifilter(
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
}


/**
 * An LR parser implementation.
 *
 * Based on the algorithm described on Wikipedia:
 * https://en.wikipedia.org/wiki/LR_parser
 */
export default class Parser extends Observable {

  /**
   * Expand a set of rule states so that all possible leaves are accounted for.
   *
   * A grammar rule's RHS often includes symbols which are not emitted by the
   * lexer, e.g. "Expression -> ▲ Value". Since an LR parser only sees one
   * upcoming symbol, a parser state must account for all possible tokens which
   * may produce a "Value".
   *
   * Higher-order tokens are recursively expanded until a "leaf" is found, and
   * all intermediate rule state are added to the set. For example, if "Value"
   * is defined as "Value -> number", then the rule state "Value -> ▲ number" is
   * added.
   *
   * @param ruleStates      An iterable collection of rule states forming the
   *                        "kernel" of the set
   * @param rulesBySubject  Map of sets of rule states from which to expand the
   *                        kernel
   */
  static _getClosure(ruleStates: Iterable<RuleState>, rulesBySubject: Map<String, GrammarRule[]>) {
    const ret = new Set(ruleStates);

    // Depth-first traversal of expansions, preventing duplicates using the
    // definition of a Set.
    //
    // The algorithm here is weird and not really portable to any other language.
    // Javascript's Set implementation is unique in that mutatating the
    // collection doesn't invalidate the iterator -- if you add elements during
    // a for-each loop, the iterator returns those elements after it finishes
    // returning the existing ones.
    //
    // (In most languages, doing this produces an error.)
    //
    // Here, our Set pulls doubles as a Queue which can prevent iterating over
    // the same thing twice.

    for (let ruleState of ret) {
      if (rulesBySubject.has(ruleState.token)) {
        for (let rule of rulesBySubject.get(ruleState.token)) {
          ret.add(rule.firstState);
        }
      }
    }

    return ret;
  }

  static _indent (x) {
    return '\t' + String(x).replace(/\n/g, '\n\t');
  }

  readonly _states: Set<ParserState> = new Set();
  _firstState: ParserState = null;
  _lastState: ParserState = null;
  _rulesBySubject: Map<String, GrammarRule[]> = new Map();

  constructor (grammar: GrammarRule[]) {
    super([ GRAMMAR_LOG, PARSE_LOG ]);

    if (grammar) {
      this.grammar = grammar;
    }
  }

  set grammar (grammar: GrammarRule[]) {
    this._rulesBySubject = Fn.partition(grammar, rule => rule.subject);

    // Print summary of grammar
    this.notify(GRAMMAR_LOG,
      Array.from(this._rulesBySubject).map(subjectAndRule =>
        'Rules for ' + subjectAndRule[0] + ':\n' +
        subjectAndRule[1].map(rule => '\t' + rule.predicate.join(' ')).join('\n')
      ).join('\n')
    );

    const baseRule = new GrammarRule('^', [grammar[0].subject, '$'], subject => subject);
    this._firstState = new ParserState(Parser._getClosure([baseRule.firstState], this._rulesBySubject));
    this._lastState = new ParserState(Parser._getClosure([baseRule.firstState.child.child], this._rulesBySubject));

    this._states.clear();
    this._addState(this._lastState);
    this._addState(this._firstState);

    this.notify(GRAMMAR_LOG, '=== summary ===');
    this.notify(GRAMMAR_LOG, 'Identified ' + this._states.size + ' states:');
    for (let state of this._states) {
      this.notify(GRAMMAR_LOG, state.toString() + `\n  (${state.nextStateForToken.size} links)`);
    }
  }

  _findDuplicateState (state) {
    return Fn.first(
      Fn.ifilter(
        this._states,
        otherState => otherState.equals(state)
      )
    );
  }

  _addState (state) {
    this.notify(GRAMMAR_LOG, 'Adding new state:\n' + Parser._indent(state));
    this._states.add(state);

    const ruleStatesByToken = Fn.partition(
      Fn.ifilter(
        state.ruleStates,
        (ruleState: RuleState) => ruleState.token !== null
      ),
      ruleState => ruleState.token
    );

    this.notify(GRAMMAR_LOG,
      'There are ' + ruleStatesByToken.size + ' tokens: ' +
      Array.from(ruleStatesByToken.keys()).join(', ')
    );

    for (let [token, ruleStates] of ruleStatesByToken) {

      const closure = Parser._getClosure(
        Fn.imap(ruleStates, (ruleState: RuleState) => ruleState.child),
        this._rulesBySubject
      );

      this.notify(GRAMMAR_LOG,
        'Creating state from rules:\n\t' +
        Array.from(closure).join('\n\t')
      );

      const child = new ParserState(closure);

      const duplicate = this._findDuplicateState(child);
      if (duplicate.has()) {
        this.notify(GRAMMAR_LOG, '... Already had state');
        state.nextStateForToken.set(token, duplicate.get());
      }
      else {
        state.nextStateForToken.set(token, child);
        this._addState(child);
      }
    }
  }

  parse (tokens: Iterable<LexerToken>) {
    const valueStack = [];
    const stateStack: ParserState[] = [this._firstState];

    this.notify(PARSE_LOG, '=== parsing ===');

    const iterator = tokens[Symbol.iterator]();
    let iteration = iterator.next();

    while (stateStack[0] !== this._lastState) {
      const lookahead: LexerToken = iteration.value;

      this.notify(PARSE_LOG, 'Lookahead:', lookahead);
      this.notify(PARSE_LOG, 'Value:', valueStack[0]);
      this.notify(PARSE_LOG, 'Current state:\n' + Parser._indent(stateStack[0]));

      if (lookahead !== undefined && stateStack[0].nextStateForToken.has(lookahead.name)) {
        const nextState = stateStack[0].nextStateForToken.get(lookahead.name);

        this.notify(PARSE_LOG, 'Shifting forward to state:\n' + Parser._indent(nextState));
        valueStack.unshift(lookahead);
        stateStack.unshift(nextState);

        iteration = iterator.next();
      }
      else if (stateStack[0].reduction === null) {
        throw new ParseError(
          `Unexpected ${lookahead.name} "${lookahead.value}" at character ${lookahead.characterIndex}. Expected one of: ` +
          Array.from(stateStack[0].nextStateForToken.keys())
        );
      }
      else {
        const rule = stateStack[0].reduction;

        this.notify(PARSE_LOG, `Reducing using rule ${rule}`);

        const popCount = rule.predicate.length;
        const values = valueStack.splice(0, popCount).reverse();
        const reducedValue = rule.reductionFn(...values.map(token => token.value));
        valueStack.unshift(new Lexer.Token(
          rule.subject,             // name
          reducedValue,             // value
          values[0].characterIndex  // characterIndex
        ));

        stateStack.splice(0, popCount);
        const nextState = stateStack[0].nextStateForToken.get(rule.subject);

        this.notify(PARSE_LOG, 'Reducing back to state:\n' + Parser._indent(stateStack[0]));
        this.notify(PARSE_LOG, 'Shifting forward to state:\n' + Parser._indent(nextState));

        stateStack.unshift(nextState);
      }
    }
    this.notify(PARSE_LOG, 'I can log!');

    return valueStack[valueStack.length - 1].value;
  }
}
