'use strict';

export class IllegalArgumentException extends Error {
  constructor(msg) {
    super(msg);
  }
}

export class OutOfBoundsException extends Error {
  constructor(msg) {
    super(msg);
  }
}
