'use strict';
const Fn = require('../util/fn');
const Lexer_1 = require('../parser/Lexer');
const Parser_1 = require('../parser/Parser');
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    _lexer: new Lexer_1.default({
        number: '(?:\\d+\\.?\\d*|\\.\\d+)',
        whitespace: '\\s+',
        'and': 'and',
        'or': 'or',
        'not': 'not',
        'true': 'true',
        'false': 'false',
        '=': '=',
        '+': '\\+',
        '*': '\\*',
        '-': '-',
        '/': '\\/',
        '^': '\\^',
        '$': '$',
        '(': '\\(',
        ')': '\\)',
    }),
    _parser: new Parser_1.default([
        new Parser_1.GrammarRule('Expr', ['OrExpr'], (OrExpr) => OrExpr),
        new Parser_1.GrammarRule('Expr', ['SumExpr'], (SumExpr) => SumExpr),
        new Parser_1.GrammarRule('OrExpr', ['OrExpr', 'or', 'AndExpr'], (OrExpr, _, AndExpr) => OrExpr || AndExpr),
        new Parser_1.GrammarRule('OrExpr', ['AndExpr'], (AndExpr) => AndExpr),
        new Parser_1.GrammarRule('AndExpr', ['AndExpr', 'and', 'BoolValue'], (AndExpr, _, Value) => AndExpr && Value),
        new Parser_1.GrammarRule('AndExpr', ['BoolValue'], (BoolValue) => BoolValue),
        new Parser_1.GrammarRule('BoolValue', ['SumExpr', '=', 'SumExpr'], (lhs, _, rhs) => lhs === rhs),
        new Parser_1.GrammarRule('BoolValue', ['BoolValue', '=', 'OrExpr'], (lhs, _, rhs) => lhs === rhs),
        new Parser_1.GrammarRule('BoolValue', ['true'], (_) => true),
        new Parser_1.GrammarRule('BoolValue', ['false'], (_) => false),
        new Parser_1.GrammarRule('BoolValue', ['not', 'BoolValue'], (_, BoolValue) => !BoolValue),
        new Parser_1.GrammarRule('BoolValue', ['(', 'OrExpr', ')'], (_1, OrExpr, _2) => OrExpr),
        new Parser_1.GrammarRule('SumExpr', ['SumExpr', '+', 'MultExpr'], (SumExpr, _, MultExpr) => SumExpr + MultExpr),
        new Parser_1.GrammarRule('SumExpr', ['SumExpr', '-', 'MultExpr'], (SumExpr, _, MultExpr) => SumExpr - MultExpr),
        new Parser_1.GrammarRule('SumExpr', ['MultExpr'], (MultExpr) => MultExpr),
        new Parser_1.GrammarRule('MultExpr', ['MultExpr', '*', 'Value'], (MultExpr, _, Value) => MultExpr * Value),
        new Parser_1.GrammarRule('MultExpr', ['MultExpr', '/', 'Value'], (MultExpr, _, Value) => MultExpr / Value),
        new Parser_1.GrammarRule('MultExpr', ['PowExpr'], (PowExpr) => PowExpr),
        new Parser_1.GrammarRule('PowExpr', ['PowExpr', '^', 'Value'], (PowExpr, _, Value) => Math.pow(PowExpr, Value)),
        new Parser_1.GrammarRule('PowExpr', ['Value'], (Value) => Value),
        new Parser_1.GrammarRule('Value', ['number'], (number) => Number(number)),
        new Parser_1.GrammarRule('Value', ['-', 'Value'], (_, Value) => -Value),
        new Parser_1.GrammarRule('Value', ['(', 'SumExpr', ')'], (_1, SumExpr, _2) => SumExpr),
    ]),
    _filterWhitespace: stream => Fn.ifilter(stream, (token) => token.name !== 'whitespace'),
    _loggingObserverHandle: null,
    _log(...args) {
        console.log(args[0], ...args.slice(1));
    },
    exec(expression, log) {
        if (this._loggingObserverHandle && !log) {
            this._loggingObserverHandle.cancel();
        }
        else if (!this._loggingObserverHandle && !!log) {
            this._parser.observe(Parser_1.PARSE_LOG, this._log);
        }
        return this._parser.parse(this._filterWhitespace(this._lexer.lex(expression)));
    }
};
//# sourceMappingURL=Arithmetic.js.map