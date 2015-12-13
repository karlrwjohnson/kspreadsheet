'use strict';

module.exports = Object.freeze({
  equals (a, b) {
    if (a.length === b.length) {
      for (let i = 0; i < a.length; a++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    }
    else {
      return false;
    }
  },

  add (a, b) {
    if (a.length === b.length) {
      return Array.from(a, (a_i, i) => a_i + b[i]);
    }
    else {
      throw Error('Vector length mismatch');
    }
  },
});
