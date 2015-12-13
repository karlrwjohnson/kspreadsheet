'use strict';

const Lexer = require('../Lexer');

describe('Lexer', ()=>{
  it('should tokenize a basic arithmetic expression', ()=>{
    const lexer = new Lexer({
      number:     '\\d+',
      whitespace: '\\s+',
      '+':        '\\+',
      '*':        '\\*',
      '-':        '-',
      '/':        '\\/',
    });

    const tokens = Array.from(lexer.lex('12 + 3 * 4'));

    expect(tokens).toEqual([
      new Lexer.Token('number',     '12',                 0),
      new Lexer.Token('whitespace', jasmine.any(String),  2),
      new Lexer.Token('+',          '+',                  3),
      new Lexer.Token('whitespace', jasmine.any(String),  4),
      new Lexer.Token('number',     '3',                  5),
      new Lexer.Token('whitespace', jasmine.any(String),  6),
      new Lexer.Token('*',          '*',                  7),
      new Lexer.Token('whitespace', jasmine.any(String),  8),
      new Lexer.Token('number',     '4',                  9),
      new Lexer.Token('$',          '',                  10),
    ]);
  });
});
