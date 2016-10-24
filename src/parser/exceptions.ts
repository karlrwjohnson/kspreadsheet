'use strict';

export class LexerError extends Error {}
export class GrammarError extends Error {}
export class ParseError extends Error {}
export class ReduceReduceConflictError extends GrammarError {}
