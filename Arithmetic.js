'use strict';

const Arithmetic = {
  _lexer: new Lexer({
    number:     '(?:\\d+\\.?\\d*|\\.\\d+)',
    whitespace: '\\s+',
    'and':      'and',
    'or':       'or',
    'not':      'not',
    'true':     'true',
    'false':    'false',
    '=':        '=',
    '+':        '\\+',
    '*':        '\\*',
    '-':        '-',
    '/':        '\\/',
    '^':        '\\^',
    '$':        '$',
    '(':        '\\(',
    ')':        '\\)',
  }),

  _parser: new Parser([
    new GrammarRule('Expr',      ['OrExpr'],                      (OrExpr) => OrExpr),
    new GrammarRule('Expr',      ['SumExpr'],                     (SumExpr) => SumExpr),

    new GrammarRule('OrExpr',    ['OrExpr', 'or', 'AndExpr'],     (OrExpr, _, AndExpr) => OrExpr || AndExpr),
    new GrammarRule('OrExpr',    ['AndExpr'],                     (AndExpr) => AndExpr),

    new GrammarRule('AndExpr',   ['AndExpr', 'and', 'BoolValue'], (AndExpr, _, Value) => AndExpr && Value),
    new GrammarRule('AndExpr',   ['BoolValue'],                   (BoolValue) => BoolValue),

    new GrammarRule('BoolValue', ['SumExpr', '=', 'SumExpr'],     (lhs, _, rhs) => lhs === rhs),
    new GrammarRule('BoolValue', ['BoolValue', '=', 'OrExpr'],    (lhs, _, rhs) => lhs === rhs),
    new GrammarRule('BoolValue', ['true'],                        (_) => true),
    new GrammarRule('BoolValue', ['false'],                       (_) => false),
    new GrammarRule('BoolValue', ['not', 'BoolValue'],            (_, BoolValue) => !BoolValue),
    new GrammarRule('BoolValue', ['(', 'OrExpr', ')'],            (_1, OrExpr, _2) => OrExpr),

    new GrammarRule('SumExpr',   ['SumExpr', '+', 'MultExpr'],    (SumExpr, _, MultExpr) => SumExpr + MultExpr),
    new GrammarRule('SumExpr',   ['SumExpr', '-', 'MultExpr'],    (SumExpr, _, MultExpr) => SumExpr - MultExpr),
    new GrammarRule('SumExpr',   ['MultExpr'],                    (MultExpr) => MultExpr),

    new GrammarRule('MultExpr',  ['MultExpr', '*', 'Value'],      (MultExpr, _, Value) => MultExpr * Value),
    new GrammarRule('MultExpr',  ['MultExpr', '/', 'Value'],      (MultExpr, _, Value) => MultExpr / Value),
    new GrammarRule('MultExpr',  ['PowExpr'],                     (PowExpr) => PowExpr),

    new GrammarRule('PowExpr',   ['PowExpr', '^', 'Value'],       (PowExpr, _, Value) => Math.pow(PowExpr, Value)),
    new GrammarRule('PowExpr',   ['Value'],                       (Value) => Value),

    new GrammarRule('Value',     ['number'],                      (number) => Number(number)),
    new GrammarRule('Value',     ['-', 'Value'],                  (_, Value) => -Value),
    new GrammarRule('Value',     ['(', 'SumExpr', ')'],           (_1, SumExpr, _2) => SumExpr),
  ]),

  _filterWhitespace: stream => Fn.filter(stream, token => token.name !== 'whitespace'),

  _loggingOberverHandle: null,

  exec (expression, log) {
    if (this._loggingOberverHandle && !log) {
      this._loggingOberverHandle.cancel();
    }
    else if (!this._loggingOberverHandle && !!log) {
      this.parser.observe(PARSER_PARSE_LOG, (...args) => console.log(...args));
    }

    return this._parser.parse(this._filterWhitespace(this._lexer.lex(expression)));
  }
}

describe('Arithmetic', ()=>{

  function fakeParse(expression) {
    return eval(expression
        .replace(/and/g, '&&')
        .replace(/or/g, '||')
        .replace(/not/g, '!')
        .replace(/=/g, '===')
    );
  }

  for (let expression of [
    // literals
    '1',
    '123',
    '1.23',
    '0.23',
    '.123',
    'true',
    'false',

    // negation
    '-1',
    'not true',
    'not false',

    // operators
    '1+2', '1-2',
    '3*4', '3/4',
    //'5^6' is not trivial to convert to Math.pow(5, 6) with a regex
    'true and true', 'false and false', 'true and false', 'false and true',
    'true or true',  'false or false',  'true or false',  'false or true',

    // parentheses + distributive property
    '(1)',
    '(true)',
    '(false)',
    '2*(3+4)', '(2*3)+4', '2*3+4',
    '2+(3*4)', '(2+3)*4', '2+3*4',

    // equality
    '1 = 1',
    '1 = 2',
    'true = true', 'false = false', 'true = false', 'false = true',

  ]) {
    it('should correctly parse expression "' + expression + '"', ()=>{
      expect(Arithmetic.exec(expression)).toBe(fakeParse(expression));
    });
  }

  it('should correctly parse expression "5^6"', ()=>{
    expect(Arithmetic.exec('5^6')).toBe(Math.pow(5,6));
  })
});
