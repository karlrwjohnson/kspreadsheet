'use strict';

class ParseError extends Error {}

class GrammarError extends Error {}

class ShiftShiftConflictError extends GrammarError {}

class ParserItem {
  constructor (rule, cursor) {
    this.rule = rule;
    this.cursor = cursor || 0;

    this.token = this.cursor < this.rule.predicate.length ? 
      this.rule.predicate[this.cursor] :
      null;

    this.nextItem = this.token === null ?
      null :
      new ParserItem(this.rule, this.cursor + 1);

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

class GrammarRule {
  constructor (subject, predicate, reductionFn) {
    this.subject = subject;
    this.predicate = Object.freeze(predicate);
    this.reductionFn = reductionFn;

    this.firstItem = new ParserItem(this, 0);

    this._toString = this.subject + ' → ' + this.predicate.join(' ');

    Object.freeze(this);
  }

  toString() {
    return this._toString;
  }
}

function setsAreEqual(set1, set2) {
  if (set1 === set2) {
    return true;
  }
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

class ParserState extends Set {
  constructor (kernelParserItems, rulesBySubject) {
    super(kernelParserItems);

    this.nextStateForToken = new Map();
    this.reduction = null;

    for (let item of this) {
      if (rulesBySubject.has(item.token)) {
        for (let rule of rulesBySubject.get(item.token)) {
          // Sets silently ignore adding duplicates
          // JavaScript lets you mutate a Set without invalidating the iterator, i.e.
          //     s = new Set([1,2,4,5])
          //     for (x of s) { if (x === 2) s.add(3); console.log(x) }
          // prints out "1 2 4 5 3"
          this.add(rule.firstItem);
        }
      }
    }

    console.log('Closure is:\n\t' +
      Array.from(this).join('\n\t'));
  }

  toString () {
    return Array.from(this).join('\n');
  }

  equals (other) {
    return setsAreEqual(this, other);
  }
}

function indent (x) {
  return '\t' + String(x).replace(/\n/g, '\n\t');
}


// https://en.wikipedia.org/wiki/LR_parser
class Parser {

  /**
   * Expand rule states whose next token is not a leaf so the parser state
   *
   * I.e. If a parser state includes the following rule state:
   *   Expression -> ▲ Value
   * and there is a rule
   *   Value -> number
   * then the parser state should include 
   */
  static _add_child_rules(itemSet, rulesBySubject) {
    const ret = new ParserState(itemSet);

    for (let item of ret) {
      if (rulesBySubject.has(item.token)) {
        for (let rule of rulesBySubject.get(item.token)) {
          // Sets silently ignore adding duplicates
          // JavaScript lets you mutate a Set without invalidating the iterator, i.e.
          //     s = new Set([1,2,4,5])
          //     for (x of s) { if (x === 2) s.add(3); console.log(x) }
          // prints out "1 2 4 5 3"
          ret.add(rule.firstItem);
        }
      }
    }

    console.log('Closure is:\n\t' +
      Array.from(ret).join('\n\t'));

    return ret;
  }

  constructor (grammarRules) {
    const nonterminals = new Set(grammarRules.map(rule => rule.subject));
    const rulesBySubject = Fn.partition(grammarRules, rule => rule.subject);

    console.log(
      Array.from(rulesBySubject)
      .map(keyValue => 'Rules for ' + keyValue[0] + ':\n' +
        Array.from(
          Fn.map(
            keyValue[1],
            rule => '\t' + rule.predicate.join(' ')
          )
        )
        .join('\n')
      )
      .join('\n')
    );

    const firstRule = new GrammarRule('^', [grammarRules[0].subject, '$'], subject => subject);
    this.firstParseState = new ParserState([firstRule.firstItem], rulesBySubject);
    const parserStates = new Set([this.firstParseState]);

    for (let parserState of parserStates) {
      console.log('Considering state:\n' + indent(parserState));

      const ruleStatesByToken = Fn.partition(
        Fn.filter(
          parserState,
          item => item.token !== null
        ),
        item => item.token
      );

      console.log('There are ' + ruleStatesByToken.size + ' tokens: ' +
        Array.from(ruleStatesByToken.keys()).join(', '));

      for (let kv of ruleStatesByToken) {
        const token = kv[0];
        const ruleStates = kv[1];

        console.log('Considering token ' + token);

        const nextState = new ParserState(
          Fn.map(
            ruleStates,
            item => item.nextItem
          ),
          rulesBySubject
        );

        const duplicateState = Fn.first(
          Fn.filter(
            parserStates,
            state => state.equals(nextState)
          )
        );

        const stateToAdd = duplicateState.orElseGet(nextState);
        parserState.nextStateForToken.set(token, stateToAdd);
        parserStates.add(stateToAdd);

        console.log((duplicateState.has() ? 'Already had state:\n' : 'Adding new state:\n') +
          indent(stateToAdd));
      }

      const terminalItems = new Set(Fn.filter(
        parserState,
        item => item.token === null
      ));

      if (terminalItems.size === 1) {
        const reduction = Fn.first(terminalItems).get().rule;
        console.log('Set is terminal. Setting default reduction to rule ' + reduction);
        parserState.reduction = reduction;
      }
      else if (terminalItems.size > 1) {
        throw new ShiftShiftConflictError(
          'Multiple reductions possible for state:\n\t' +
          Array.from(terminalItems).join('\n\t')
        );
      }
    }

    console.log('=== summary ===');
    console.log('Identified ' + parserStates.size + ' states:')
    for (let parserState of parserStates) {
      console.log(parserState.toString() + `\n  (${parserState.nextStateForToken.size} links)`);
    }
  }

  parse (tokens) {
    const valueStack = [];
    const stateStack = [this.firstParseState];
    const stackEmpty = new Error('Parse stack empty');

    function currentState () {
      return Fn.last(stateStack).orElseThrow(stackEmpty);
    }

    console.log('=== parsing ===');

    for (let lookahead of tokens) {
      console.log('Current state:\n' + indent(currentState()));
      console.log('Lookahead:', lookahead);

      while (!currentState().nextStateForToken.has(lookahead.name)) {
        const rule = currentState().reduction;

        if (rule === null) {
          throw new ParseError(
            `Unexpected ${lookahead.name} "${lookahead.value}" at character ${lookahead.characterIndex}. Expected one of: ` +
            Array.from(currentState().nextStateForToken.keys())
          );
        }
        else {
          console.log(`Reducing using rule ${rule}`);

          const popCount = rule.predicate.length;
          const values = valueStack.splice(-popCount, Infinity);
          const reducedValue = rule.reductionFn(...values.map(token => token.value));
          valueStack.push({
            name: rule.subject,
            value: reducedValue,
            characterIndex: values[0].characterIndex,
          });

          stateStack.splice(-popCount, Infinity);
          const nextState = currentState().nextStateForToken.get(rule.subject);

          console.log('Reducing back to state:\n' + indent(currentState()));
          console.log('Shifting forward to state:\n' + indent(nextState));

          stateStack.push(nextState);
        }
      }

      const nextState = currentState().nextStateForToken.get(lookahead.name);
      console.log('Shifting forward to state:\n' + indent(nextState));
      valueStack.push(lookahead);
      stateStack.push(nextState);
    }

    console.log('value stack: ', valueStack);
    console.log('state stack: ', stateStack);


        const rule = currentState().reduction;

        if (rule === null) {
          throw new ParseError(
            `Unexpected ${lookahead.name} "${lookahead.value}" at character ${lookahead.characterIndex}. Expected one of: ` +
            Array.from(currentState().nextStateForToken.keys())
          );
        }
        else {
          console.log(`Reducing using rule ${rule}`);

          const popCount = rule.predicate.length;
          const values = valueStack.splice(-popCount, Infinity);
          const reducedValue = rule.reductionFn(...values.map(token => token.value));
          valueStack.push({
            name: rule.subject,
            value: reducedValue,
            characterIndex: values[0].characterIndex,
          });

          stateStack.splice(-popCount, Infinity);

          console.log('Reducing back to state:\n' + indent(currentState()));
        }

    console.log('value stack: ', valueStack);
    console.log('state stack: ', stateStack);

    return valueStack[0].value;
  }
}

const lexer = new Lexer({
  number:     '\\d+',
  whitespace: '\\s+',
  '+':        '\\+',
  '*':        '\\*',
  '-':        '-',
  '/':        '\\/',
  '$':        '$',
});

const parser = new Parser(
  [
    new GrammarRule('sum',     ['sum', '+', 'product'],   (sum, _, product) => sum + product),
    new GrammarRule('sum',     ['sum', '-', 'product'],   (sum, _, product) => sum - product),
    new GrammarRule('sum',     ['product'],               (product) => product),

    new GrammarRule('product', ['product', '*', 'value'], (product, _, value) => product * value),
    new GrammarRule('product', ['product', '/', 'value'], (product, _, value) => product / value),
    new GrammarRule('product', ['value'],                 (value) => value),

    new GrammarRule('value',   ['number'],                (number) => Number(number)),
  ]
);

const tokens = lexer.lex('12+3*4');
const filteredTokens = Fn.filter(tokens, token => token.name !== 'whitespace');
const noIdea = parser.parse(filteredTokens);
console.log('result is:', noIdea);
