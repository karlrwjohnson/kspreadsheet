'use strict';

const fs = require('fs');
const path = require('path');

module.exports = Object.freeze({
  /**
   * Depth-first traversal of files in a directory, just like the UNIX find
   * command
   *
   * @param pathname {String} Path to search
   * @param filterFn {Function} Optional condition to filter the return values.
   *                            Takes the path name as a parameter.
   */
  * find (pathname, filterFn) {
    // Sort directories from files the Pythonic way:
    // Try treating it like one thing and recover from the error
    // (I.e. it's easier to ask forgiveness than permission)
    // (The actual justification is that it prevents the unlikely case something
    // happened to the file between stat() and read())
    try {
      for (let filename of fs.readdirSync(pathname)) {
        for (let file of this.find(path.join(pathname, filename), filterFn)) {
          yield file;
        }
      }
    }
    catch(e) {
      if ('code' in e && e.code === 'ENOTDIR') {
        if (!filterFn || filterFn(pathname)) {
          yield pathname;
        }
      }
      else {
        throw e;
      }
    }
  }
});
