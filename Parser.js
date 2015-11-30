'use strict';

const PARSER_GRAMMAR_LOG = Symbol('PARSER_GRAMMAR_LOG');
const PARSER_PARSE_LOG = Symbol('PARSER_PARSE_LOG');

class ParseError extends Error {}

class GrammarError extends Error {}

class ReduceReduceConflictError extends GrammarError {}

/**
 * A rule defining a language, i.e. Value -> int or Expression -> Value + Value
 */
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
}

/**
 * A position inside a GrammarRule, indicating how much of the rule has been
 * matched by a parser.
 */
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
      ).join(' ')

    Object.freeze(this);
  }

  toString() {
    return this._toString;
  }
}

/**
 * Equivalence comparison for sets
 */
function setsAreEqual(set1, set2) {
  // Same reference (trivial)
  if (set1 === set2) {
    return true;
  }

  // Same size and same items
  else if (set1.size === set2.size) {
    for (let item of set1) {
      if (!set2.has(item)) {
        return false;
      }
    }
    return true;
  }
  else {
    return false;
  }
}

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
    return setsAreEqual(this.ruleStates, other.ruleStates);
  }
}

function indent (x) {
  return '\t' + String(x).replace(/\n/g, '\n\t');
}


// https://en.wikipedia.org/wiki/LR_parser
class Parser extends Observable {

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
   * @param ruleState       An iterable collection of rule states forming the
   *                        "kernel" of the set
   * @param rulesBySubject  Map of sets of rule states from which to expand the
   *                        kernel
   */
  static _getClosure(ruleStates, rulesBySubject) {
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

  constructor (grammar) {
    super([ PARSER_GRAMMAR_LOG, PARSER_PARSE_LOG ]);

    this._states = new Set();
    this._firstState = null;
    this._lastState = null;
    this._rulesBySubject = null;

    Object.seal(this);

    if (grammar) {
      this.grammar = grammar;
    }
  }

  set grammar (grammar) {
    this._rulesBySubject = Fn.partition(grammar, rule => rule.subject);

    // Print summary of grammar
    this.notify(PARSER_GRAMMAR_LOG,
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

    this.notify(PARSER_GRAMMAR_LOG, '=== summary ===');
    this.notify(PARSER_GRAMMAR_LOG, 'Identified ' + this._states.size + ' states:')
    for (let state of this._states) {
      this.notify(PARSER_GRAMMAR_LOG, state.toString() + `\n  (${state.nextStateForToken.size} links)`);
    }
  }

  _findDuplicateState (state) {
    return Fn.first(
      Fn.filter(
        this._states,
        otherState => otherState.equals(state)
      )
    );
  }

  _addState (state) {
    this.notify(PARSER_GRAMMAR_LOG, 'Adding new state:\n' + indent(state));
    this._states.add(state);

    const ruleStatesByToken = Fn.partition(
      Fn.filter(
        state.ruleStates,
        ruleState => ruleState.token !== null
      ),
      ruleState => ruleState.token
    );

    this.notify(PARSER_GRAMMAR_LOG,
      'There are ' + ruleStatesByToken.size + ' tokens: ' +
      Array.from(ruleStatesByToken.keys()).join(', ')
    );

    for (let _ of ruleStatesByToken) {
      const token = _[0];
      const ruleStates = _[1];

      const child = new ParserState(Parser._getClosure(
        Fn.map(ruleStates, ruleState => ruleState.child),
        this._rulesBySubject
      ));

      const duplicate = this._findDuplicateState(child);
      if (duplicate.has()) {
        this.notify(PARSER_GRAMMAR_LOG, 'Already had state:\n' + indent(state));
        state.nextStateForToken.set(token, duplicate.get());
      }
      else {
        state.nextStateForToken.set(token, child);
        this._addState(child);
      }
    }
  }

  parse (tokens) {
    const valueStack = [];
    const stateStack = [this._firstState];
    const stackEmpty = new Error('Parse stack empty');

    this.notify(PARSER_PARSE_LOG, '=== parsing ===');

    const iterator = tokens[Symbol.iterator]();
    let iteration = iterator.next();

    while (stateStack[0] !== this._lastState) {
      const lookahead = iteration.value;

      this.notify(PARSER_PARSE_LOG, 'Lookahead:', lookahead);
      this.notify(PARSER_PARSE_LOG, 'Value:', valueStack[0]);
      this.notify(PARSER_PARSE_LOG, 'Current state:\n' + indent(stateStack[0]));

      if (lookahead !== undefined && stateStack[0].nextStateForToken.has(lookahead.name)) {
        const nextState = stateStack[0].nextStateForToken.get(lookahead.name);

        this.notify(PARSER_PARSE_LOG, 'Shifting forward to state:\n' + indent(nextState));
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

        this.notify(PARSER_PARSE_LOG, `Reducing using rule ${rule}`);

        const popCount = rule.predicate.length;
        const values = valueStack.splice(0, popCount);
        const reducedValue = rule.reductionFn(...values.map(token => token.value));
        valueStack.unshift(new LexerToken(
          rule.subject,             // name
          reducedValue,             // value
          values[0].characterIndex  // characterIndex
        ));

        stateStack.splice(0, popCount);
        const nextState = stateStack[0].nextStateForToken.get(rule.subject);

        this.notify(PARSER_PARSE_LOG, 'Reducing back to state:\n' + indent(stateStack[0]));
        this.notify(PARSER_PARSE_LOG, 'Shifting forward to state:\n' + indent(nextState));

        stateStack.unshift(nextState);
      }
    }
    this.notify(PARSER_PARSE_LOG, 'I can log!');

    return valueStack[valueStack.length - 1].value;
  }
}


const arithmetic = {
  lexer: new Lexer({
    number:     '\\d+',
    whitespace: '\\s+',
    '+':        '\\+',
    '*':        '\\*',
    '-':        '-',
    '/':        '\\/',
    '^':        '\\^',
    '$':        '$',
    '(':        '\\(',
    ')':        '\\)',
  }),

  parser: new Parser([
    new GrammarRule('sum',     ['sum', '+', 'product'],   (sum, _, product) => sum + product),
    new GrammarRule('sum',     ['sum', '-', 'product'],   (sum, _, product) => sum - product),
    new GrammarRule('sum',     ['product'],               (product) => product),

    new GrammarRule('product', ['product', '*', 'value'], (product, _, value) => product * value),
    new GrammarRule('product', ['product', '/', 'value'], (product, _, value) => product / value),
    new GrammarRule('product', ['power'],                 (power) => power),

    new GrammarRule('power',   ['power', '^', 'value'],   (power, _, value) => Math.pow(value, power)),
    new GrammarRule('power',   ['value'],                 (value) => value),

    new GrammarRule('value',   ['number'],                (number) => Number(number)),
    new GrammarRule('value',   ['(', 'sum', ')'],         (_1, sum, _2) => Number(sum)),
  ]),

  filterWhitespace: stream => Fn.filter(stream, token => token.name !== 'whitespace'),

  _loggingOberverHandle: null,

  exec: function(expression, log) {
    if (this._loggingOberverHandle && !log) {
      this._loggingOberverHandle.cancel();
    }
    else if (!this._loggingOberverHandle && !!log) {
      this.parser.observe(PARSER_PARSE_LOG, (...args) => console.log(...args));
    }

    return this.parser.parse(this.filterWhitespace(this.lexer.lex(expression)));
  }
}

//parser.observe(PARSER_GRAMMAR_LOG, (...args) => console.log(...args));
//parser.observe(PARSER_PARSE_LOG, (...args) => console.log(...args));


const sampleExpression = '12 + 3 * 5';
console.log(sampleExpression, '=', arithmetic.exec(sampleExpression));