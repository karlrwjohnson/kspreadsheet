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

class ParserRule {
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

class ItemSet extends Set {
  constructor (...args) {
    super(...args);

    this.nextStateForToken = new Map();
    this.reduction = null;
  }

  toString () {
    return Array.from(this).join('\n');
  }
}

function setsEqual(set1, set2) {
  //console.log('comparing sets', set1, set2);
  if (set1.size === set2.size) {
    for (let item of set1) {
      if (!set2.has(item)) {
        //console.log('set2 lacks element from set1. element = ', element, ' set1 = ', set1, ' set 2 = ', set2);
        return false;
      }
    }
    return true;
  }
  else {
    return false;
  }
}

function _item_set_closure(itemSet, rulesBySubject) {
  const ret = new ItemSet(itemSet);

  //console.log('Kernel of closure is:\n\t' +
  //  Array.from(ret).join('\n\t'));

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

// https://en.wikipedia.org/wiki/LR_parser
class Parser {

  constructor (rules) {
    const nonterminals = new Set(rules.map(rule => rule.subject));

    const rulesBySubject = new Map(
      Fn.map(nonterminals, subject => [
        subject,
        new Set(
          rules.filter(rule =>
            rule.subject === subject
          )
        )
      ])
    );

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

    const firstRule = new ParserRule('^', [rules[0].subject, '$'], subject => subject);

    this.firstItemSet = _item_set_closure([firstRule.firstItem], rulesBySubject);
    const itemSets = new Set([this.firstItemSet]);

    for (let itemSet of itemSets) {
      console.log('Considering item set:\n\t' + itemSet);

      const nextSetsByToken = Fn.partition(
        Fn.filter(
          itemSet,
          item => item.token !== null
        ),
        item => item.token
      );

      console.log('There are ' + nextSetsByToken.size + ' tokens: ' +
        Array.from(nextSetsByToken.keys).join(', '));

      for (let kv of nextSetsByToken) {
        const nextToken = kv[0];
        const partialItemSet = kv[1];

        console.log('Considering token ' + nextToken);

        const nextItemSet = _item_set_closure(
          Fn.map(
            partialItemSet,
            item => item.nextItem
          ),
          rulesBySubject
        );

        const knownItemSet = Fn.first(
          Fn.filter(
            itemSets,
            knownItemSet => setsEqual(nextItemSet, knownItemSet)
          )
        );

        if (!knownItemSet.has()) {
          console.log('Adding new item set');
          itemSets.add(nextItemSet);
        } else {
          console.log('Already had identical item set:\n\t' +
            Array.from(knownItemSet.get()).join('\n\t'));
        }

        itemSet.nextStateForToken.set(
          nextToken,
          knownItemSet.orElseGet(nextItemSet)
        );
      }

      const terminalItems = new Set(Fn.filter(
        itemSet,
        item => item.token === null
      ));

      if (terminalItems.size === 1) {
        const reduction = Fn.first(terminalItems).get().rule;
        console.log('Set is terminal. Setting default reduction to rule ' + reduction);
        itemSet.reduction = reduction;
      }
      else if (terminalItems.size > 1) {
        throw new ShiftShiftConflictError(
          'Multiple reductions possible for state:\t\n' +
          Array.from(terminalItems).join('\n\t')
        );
      }
    }

    console.log('=== summary ===');
    console.log('Found ' + itemSets.size + ' item sets.')
    for (let itemSet of itemSets) {
      console.log(itemSet.toString() + `\n  (${itemSet.nextStateForToken.size} links)`);
    }
  }

  parse (tokens) {
    const valueStack = [];
    const stateStack = [this.firstItemSet];
    const stackEmpty = new Error('Parse stack empty');

    function currentState () {
      return Fn.last(stateStack).orElseThrow(stackEmpty);
    }

    function indent (x) {
      return '\t' + String(x).replace(/\n/g, '\n\t');
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
    new ParserRule('sum',     ['sum', '+', 'product'],   (sum, _, product) => sum + product),
    new ParserRule('sum',     ['sum', '-', 'product'],   (sum, _, product) => sum - product),
    new ParserRule('sum',     ['product'],               (product) => product),

    new ParserRule('product', ['product', '*', 'value'], (product, _, value) => product * value),
    new ParserRule('product', ['product', '/', 'value'], (product, _, value) => product / value),
    new ParserRule('product', ['value'],                 (value) => value),

    new ParserRule('value',   ['number'],                (number) => Number(number)),
  ]
);

const tokens = lexer.lex('12+3*4');
const filteredTokens = Fn.filter(tokens, token => token.name !== 'whitespace');
const noIdea = parser.parse(filteredTokens);
console.log('result is:', noIdea);
