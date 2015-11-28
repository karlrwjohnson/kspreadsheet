'use strict';

/// This Javascript Standard Library has some massive holes

/**
 * Create an array of length `length` whose elements are defined by `fn`
 */
function arrayFromFn (length, fn) {
  return Array.from(Array(length), (_, i) => fn(i));
}

class Optional {
  constructor (thing) {
    this._thing = thing;
  }

  static of (thing) {
    if (thing === null || thing === undefined) {
      throw new Error('Optional.of() cannot be called with argument ' + thing +
        '. Try ofNullable instead.');
    }
    return new Optional(thing);
  }

  static ofNullable (thing) {
    return new Optional(thing);
  }

  static ofNull () {
    return new Optional(null);
  }

  static ofUndefined () {
    return new Optional(undefined);
  }

  get() {
    if (this.has()) {
      return this._thing;
    }
    else {
      throw new Error('Cannot get value ' + this._thing + ' from Optional.');
    }
  }

  has() {
    return this._thing !== null && this._thing !== undefined;
  }

  orElseGet(otherThing) {
    if (this.has()) {
      return this._thing;
    }
    else {
      return otherThing;
    }
  }

  orElseThrow(error) {
    if (this.has()) {
      return this._thing;
    }
    else {
      throw error;
    }
  }
}

const Fn = Object.freeze({
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
    return Array.from(Array(n), (_, i) => i);
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
    for (let x of iterable) {
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
      for (x of iterable);
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
  }
});

describe('Fn', ()=>{
  const items = Object.freeze(['a','b','c','d']);
  const arrayLike = Object.freeze({0: 'a', 1: 'b', 2: 'c', 3: 'd', length: 4});

  function* itemGenerator () {
    for (let item of items) {
      yield item;
    }
  }

  function* emptyGenerator () {
    return;
  }

  describe('.any', ()=>{
    it('should work as expected', ()=>{
      expect(Fn.any([false, false])).toBeFalsy();
      expect(Fn.any([false, true])).toBeTruthy();
      expect(Fn.any([true, false])).toBeTruthy();
      expect(Fn.any([true, true])).toBeTruthy();
    });
  });

  describe('.all', ()=>{
    it('should work as expected', ()=>{
      expect(Fn.all([false, false])).toBeFalsy();
      expect(Fn.all([false, true])).toBeFalsy();
      expect(Fn.all([true, false])).toBeFalsy();
      expect(Fn.all([true, true])).toBeTruthy();
    });
  });

  describe('.arrayFromItr', ()=>{
    it('should create an array from a generator', ()=>{
      expect(Fn.arrayFromItr(itemGenerator())).toEqual(items);
    });
  });

  describe('.indexOf', ()=>{
    it('should find the index of an element in a generator', ()=>{
      expect(Fn.indexOf(itemGenerator(), 'a')).toEqual(0);
      expect(Fn.indexOf(itemGenerator(), 'b')).toEqual(1);
      expect(Fn.indexOf(itemGenerator(), 'c')).toEqual(2);
      expect(Fn.indexOf(itemGenerator(), 'd')).toEqual(3);
    });
    it('should return false if an element is not found in a generator', ()=>{
      expect(Fn.indexOf(itemGenerator(), 'z')).toEqual(false);
    });
    it('should find the index of an element in a list', ()=>{
      expect(Fn.indexOf(items, 'a')).toEqual(0);
      expect(Fn.indexOf(items, 'b')).toEqual(1);
      expect(Fn.indexOf(items, 'c')).toEqual(2);
      expect(Fn.indexOf(items, 'd')).toEqual(3);
    });
    it('should return false if an element is not found in a list', ()=>{
      expect(Fn.indexOf(items, 'z')).toEqual(false);
    });
    it('should find the index of an element in an array-like object', ()=>{
      expect(Fn.indexOf(arrayLike, 'a')).toEqual(0);
      expect(Fn.indexOf(arrayLike, 'b')).toEqual(1);
      expect(Fn.indexOf(arrayLike, 'c')).toEqual(2);
      expect(Fn.indexOf(arrayLike, 'd')).toEqual(3);
    });
    it('should return false if an element is not found in an array-like object', ()=>{
      expect(Fn.indexOf(arrayLike, 'z')).toEqual(false);
    });
  });

  describe('.range', ()=>{
    it('should return a list of incrementing numbers', ()=>{
      expect(Fn.range(0)).toEqual([]);
      expect(Fn.range(1)).toEqual([0]);
      expect(Fn.range(2)).toEqual([0,1]);
      expect(Fn.range(3)).toEqual([0,1,2]);
    });
  });

  describe('.filter', ()=>{
    it('should filter items of an iterator', ()=>{
      const filtered = Fn.filter(itemGenerator(), x => x.match(/[bd]/));
      expect(Array.from(filtered))
        .toEqual(['b', 'd']);
    });
  });

  describe('.map', ()=>{
    it('should map items of an iterator', ()=>{
      const mapped = Fn.map(itemGenerator(), x => x + '_');
      expect(Array.from(mapped))
        .toEqual(['a_', 'b_', 'c_', 'd_']);
    });
  });

  describe('.first', ()=>{
    it('should return the first element of a non-null iterator', ()=>{
      const first = Fn.first(itemGenerator());
      expect(first.has()).toBeTruthy();
      expect(first.get()).toBe('a');
    });

    it('should return an empty optional from a null iterator', ()=>{
      const first = Fn.first(emptyGenerator());
      expect(first.has()).toBeFalsy();
    });
  });

  describe('.partition', ()=>{
    it('should sort items based on criteria', ()=>{
      function isVowel(char) {
        return char.match(/[aeiou]/);
      }

      const partitioned = Fn.partition(itemGenerator(), x => isVowel(x) ? true : false);

      expect(Array.from(partitioned)).toEqual([
        [ true, ['a'] ],
        [ false, ['b', 'c', 'd'] ],
      ]);
    });
  });
});

function* zip (iterable1, iterable2) {
  const iterator1 = iterable1[Symbol.iterator]();
  const iterator2 = iterable2[Symbol.iterator]();
  let value1;
  let value2;
  while ( !(value1 = iterator1.next()).done && !(value2 = iterator2.next()).done ) {
    yield [value1.value, value2.value];
  }
}

function log () {
  console.log.apply(console, arguments);
}

function vecEquals (a, b) {
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
}

function vecAdd (a, b) {
  if (a.length === b.length) {
    return Array.from(a, (a_i, i) => a_i + b[i]);
  }
  else {
    throw Error('Vector length mismatch')
  }
}

class OutOfBoundsException extends Error {
  constructor(msg) {
    super(msg);
  }
}

class IllegalArgumentException extends Error {
  constructor(msg) {
    super(msg);
  }
}
