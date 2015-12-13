'use strict';

module.exports =
class OutOfBoundsException extends Error {
  constructor(msg) {
    super(msg);
  }
}
