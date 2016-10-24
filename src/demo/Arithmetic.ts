'use strict';

import * as Fn from '../util/fn';
import Lexer from '../parser/Lexer';
import { LexerToken } from '../parser/Lexer';
import Parser, { PARSE_LOG, GrammarRule } from '../parser/Parser';

export default {
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

  _filterWhitespace: stream => Fn.ifilter(stream, (token: LexerToken) => token.name !== 'whitespace'),

  _loggingObserverHandle: null,

  _log(...args: any[]) {
    console.log(args[0], ...args.slice(1));
  },

  exec (expression: string, log?: boolean) {
    if (this._loggingObserverHandle && !log) {
      this._loggingObserverHandle.cancel();
    }
    else if (!this._loggingObserverHandle && !!log) {
      this._parser.observe(PARSE_LOG, this._log);
    }

    return this._parser.parse(this._filterWhitespace(this._lexer.lex(expression)));
  }
};
