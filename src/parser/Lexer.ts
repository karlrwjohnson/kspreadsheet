'use strict';

import * as Fn from '../util/fn'

import { LexerError } from './exceptions'

export class LexerToken {
  name: string;
  value: string;
  characterIndex: number;

  constructor (name, value, characterIndex) {
    this.name = name;
    this.value = value;
    this.characterIndex = characterIndex;

    Object.freeze(this);
  }
}

export interface LexerDefinition {
  [index: string]: string
}

export default class Lexer {
  _defs: { 'regex': RegExp, 'name': string }[];

  static get Error () { return LexerError; }
  static get Token () { return LexerToken; }

  constructor (defs: LexerDefinition) {
    this._defs = Object.keys(defs)
      .map(name => ({
        'regex': new RegExp('^' + defs[name]),
        'name': name
      }));
  }

  * lex (string: string) {
    for (let index = 0; index < string.length; ) {
      // Find the longest match by running each symbol def on the remaining
      // expression.

      // This could be more efficient by converting the regexes to a giant
      // state machine and building a symbol table for each state, but it's
      // complicated and I don't need the performance just yet.

      // JS's regex library doesn't let you specify a starting offset.
      // I hope slices perform well.
      const remainingString = string.slice(index);

      const token = Fn.first(
        this._defs
          .map(def => ({ matches: remainingString.match(def.regex), name: def.name, characterIndex: index }))
          .filter(def => def.matches !== null)
          .map(def => new LexerToken(def.name, def.matches[0], def.characterIndex))
          .sort((a, b) => a.value.length < b.value.length ? -1 : 1)
      ).orElseThrow(new LexerError(
        `Syntax error at character ${index} of ${string}`
      ));

      index += token.value.length;
      yield token;
    }

    yield new LexerToken('$', '', string.length);
  }
}
