'use strict';

const Optional = require('./../Optional');

module.exports = Object.freeze({
  any (iterable, fn) {
    if (fn) {
      for (let i of iterable) {
        if (fn(i)) {
          return true;
        }
      }
      return false;
    }
    else {
      for (let i of iterable) {
        if (i) {
          return true;
        }
      }
      return false;
    }
  },
  all (iterable, fn) {
    if (fn) {
      for (let i of iterable) {
        if (!fn(i)) {
          return false;
        }
      }
      return true;
    }
    else {
      for (let i of iterable) {
        if (!i) {
          return false;
        }
      }
      return true;
    }
  },
  arrayFromItr (iterable) {
    const ret = [];
    for (let item of iterable) {
      ret.push(item);
    }
    return ret;
  },
  indexOf (iterable, item) {
    if (Symbol.iterator in iterable) {
      let i = 0;
      for (let x of iterable) {
        if (item === x) {
          return i;
        }
        else {
          i++;
        }
      }
      return false;
    }
    else if ('length' in iterable) {
      for (let i = 0; i < iterable.length; i++) {
        if (item === iterable[i]) {
          return i;
        }
      }
      return false;
    }
    else {
      throw Error(`${iterable} is not iterable`);
    }
  },
  range (n) {
    return Array.from(new Array(n), (_, i) => i);
  },
  rangeFn (n, fn) {
    return Array.from(new Array(n), (_, i) => fn(i));
  },
  * filter (iterable, filterFn) {
    let i = 0;
    for (let x of iterable) {
      if (filterFn(x, i)) {
        yield x;
      }
      i++;
    }
  },
  * map (iterable, mapFn) {
    let i = 0;
    for (let x of iterable) {
      yield mapFn(x, i);
      i++;
    }
  },
  first (iterable) {
    //noinspection LoopStatementThatDoesntLoopJS
    for (let x of iterable) {
      // It is not a bug that this for loop returns immediately.
      // It's a lazy way to get the first element of the iterator
      return Optional.of(x);
    }
    return Optional.ofNull();
  },

  last (iterable) {
    if ('slice' in iterable) {
      return Optional.ofNullable(iterable.slice(-1)[0]);
    }
    else {
      let x;
      for (x of iterable) {}
      return Optional.ofNullable(x);
    }
  },

  /**
   * Sort a set of items from `iterable` into buckets based on a key returned
   * by mapping function `keyFn`
   *
   * @param iterable (Iterable)            The items to sort
   * @param keyFn (Function<item> -> key)  A mapping function returning which
   *                                       bucket to place the item into
   * @return (Map<key, Array<item>>)       The sorted elements
   */
  partition (iterable, keyFn) {
    const ret = new Map();
    for (let x of iterable) {
      const key = keyFn(x);
      if (ret.has(key)) {
        ret.get(key).push(x);
      }
      else {
        ret.set(key, [x]);
      }
    }
    return ret;
  },

  * concat (...iterables) {
    for (let iterable of iterables) {
      for (let item of iterable) {
        yield item;
      }
    }
  },


  /**
   * Equivalence comparison for sets
   */
  setsAreEqual (set1, set2) {
    // Same reference (trivial)
    if (set1 === set2) {
      return true;
    }

    // Same size and same items
    else if (set1.size === set2.size) {
      for (let item of set1) {
        if (!set2.has(item)) {
          return false;
        }
      }
      return true;
    }
    else {
      return false;
    }
  },

  /**
   * Yields all constructors of an object starting with the most recent
   */
  * getConstructors (object) {
    for (let prototype = Object.getPrototypeOf(object);
         prototype !== null;
         prototype = Object.getPrototypeOf(prototype)) {
      yield prototype.constructor;
    }
  },

  /**
   * Combine multiple iterables, yielding an array for each value
   */
  * zip (...iterables) {
    const iterators = iterables.map(iterable => iterable[Symbol.iterator]());

    //noinspection JSUnresolvedVariable (IteratorItem::done)
    for (let iterations = iterators.map(itr => itr.next());
         !this.all(iterations, iteration => iteration.done);
         iterations = iterators.map(itr => itr.next())) {
      yield iterations.map(iteration => iteration.value);
    }
  }

});
