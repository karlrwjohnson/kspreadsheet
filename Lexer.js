'use strict';

class LexerError extends Error {}

class LexerToken {
  constructor (name, value, characterIndex) {
    this.name = name;
    this.value = value;
    this.characterIndex = characterIndex;

    Object.freeze(this);
  }
}

class Lexer {
  constructor (defs) {
    this._defs = Object.keys(defs)
      .map(name => ({
        'regex': new RegExp('^' + defs[name]),
        'name': name
      }));
  }

  * lex (string) {
    for (let index = 0; index < string.length; ) {
      // Find the longest match by running each symbol def on the remaining
      // expression.

      // This could be more efficient by converting the regexes to a giant
      // state machine and building a symbol table for each state, but it's
      // complicated and I don't need the performance just yet.

      // JS's regex library doens't let you specify a starting offset.
      // I hope slices perform well.
      const remainingString = string.slice(index);

      const token = Fn.first(
        this._defs
          .map(def => ({ matches: remainingString.match(def.regex), name: def.name, characterIndex: index }))
          .filter(def => def.matches !== null)
          .map(def => new LexerToken(def.name, def.matches[0], def.characterIndex))
          .sort((a, b) => a.value.length < b.value.length)
      ).orElseThrow(new LexerError(
        `Syntax error at character ${index} of ${string}`
      ));

      index += token.value.length;
      yield token;
    }

    yield new LexerToken('$', '', string.length);
  }
}

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
      new LexerToken('number',     '12',                 0),
      new LexerToken('whitespace', jasmine.any(String),  2),
      new LexerToken('+',          '+',                  3),
      new LexerToken('whitespace', jasmine.any(String),  4),
      new LexerToken('number',     '3',                  5),
      new LexerToken('whitespace', jasmine.any(String),  6),
      new LexerToken('*',          '*',                  7),
      new LexerToken('whitespace', jasmine.any(String),  8),
      new LexerToken('number',     '4',                  9),
      new LexerToken('$',          '',                  10),
    ]);
  });
});

