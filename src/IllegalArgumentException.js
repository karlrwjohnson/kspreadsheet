'use strict';

module.exports =
class IllegalArgumentException extends Error {
  constructor(msg) {
    super(msg);
  }
};
