/**
 * Utility functions for functional programming
 */

import {Optional} from "../Optional";

export type Iterablish<T> = Iterator<T> | Iterable<T> | ArrayLike<T>;

type Consumer<T> = (value: T) => void;
type MapFn<T, R> = (value: T, index?: number, iterable?: Iterablish<T>) => R;
type FilterFn<T> = MapFn<T, boolean>;

function isPromise <T> (value: Promise<T> | any): value is Promise<T> {
  return (typeof value === 'object') && ('then' in value);
}

/**
 * Determines whether all elements of an iterable satisfy a condition
 * @param {Iterablish<T>} iterable
 * @param {Function} fn (Optional) - Test function. Defaults to boolean cast.
 */
export function all <T> (iterable: Iterablish<T>, fn?: FilterFn<T>): boolean {
  if (fn) {
    for (let i of iterate(iterable)) {
      if (!fn(i)) {
        return false;
      }
    }
    return true;
  }
  else {
    for (let i of iterate(iterable)) {
      if (!i) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Determines whether any elements of an iterable satisfy a condition
 * @param {Iterable|ArrayLike} iterable
 * @param {Function} fn (Optional) - Test function. Defaults to boolean cast.
 */
export function any <T> (iterable: Iterablish<T>, fn?: FilterFn<T>): boolean {
  if (fn) {
    for (let i of iterate(iterable)) {
      if (fn(i)) {
        return true;
      }
    }
    return false;
  }
  else {
    for (let i of iterate(iterable)) {
      if (i) {
        return true;
      }
    }
    return false;
  }
}

type RangeMapFn<T> = (value?: number, index?: number) => T;

function parseRangeArgs <T> (
    a: number,
    b?: number | RangeMapFn<T>,
    c?: RangeMapFn<T>
): [number, number, RangeMapFn<T>] {
  let start: number;
  let end: number;
  let fn: RangeMapFn<T> = undefined;

  // Process arguments
  if (typeof b === 'number') {
    start = a;
    end = b;

    if (typeof c === 'function') {
      fn = <RangeMapFn<T>> c;
    }
  } else {
    start = 0;
    end = a;

    if (typeof b === 'function') {
      fn = <RangeMapFn<T>> b;
    }
  }

  return [start, end, fn]
}

/**
 * Initialize an array of increasing values
 *
 * @param {Number} minOrMax (Optional) - Initial value. Default 0.
 * @param {Number} max - End value, plus 1.
 */
export function arange (
    minOrMax: number,
    max?: number
): number[] {
  if (max === undefined) {
    max = minOrMax;
    minOrMax = 0;
  }

  // Value to return
  const ret = new Array(max - minOrMax);

  for (let i = 0, val = minOrMax; val < max; i++, val++) {
    ret[i] = val;
  }

  return ret;
}

/**
 * Initialize an array of increasing values
 *
 * @param {Number} length
 * @param {Function(Number)} fn
 */
export function arangeMap<T> (
    length: number,
    fn: (i?: number) => T
): T[] {

  // Value to return
  const ret = new Array(length);

  for (let i = 0; i < length; i++) {
    ret[i] = fn(i);
  }

  return ret;
}


/**
 * Emulates the upcoming `async` keyword, executing an asynchronous function
 * (expressed as a generator). Each time the generator `yield`s a Promise,
 * this function hooks into its `::then()` method and passing the resolved
 * value back in through the `yield` keyword. Functions written in this manner
 * are more legible and more closely resemble non-asynchronous Javascript than
 * asynchronous code written with callbacks or Promise chains.
 *
 * @param {Generator} generator - Function to run
 * @return {Promise} - A promise which resolves when the generator returns
 *
 * Example:
 * asyncExec(function*() {
 *   // Presumably, httplibrary::get returns a Promise.
 *   try {
 *     const value = yield httplibrary.get('http://www.google.com');
 *     if (value.contains('hello')) {
 *       return true;
 *     } else {
 *       return false;
 *     }
 *   } catch(e) {
 *     return "Could not load."
 *   }
 * });
 */
export function asyncExec (generator: Function): Promise<any> {
  return new Promise((resolve: any, reject: any) => {
    const iterator: Iterator<any> = generator();

    function processIteration (iteration: {done: boolean, value?: Promise<any> | any}) {
      // Generator has returned successfully
      if (iteration.done) {
        resolve(iteration.value);
      }
      // Generator has returned a promise
      else if ('value' in iteration && isPromise(iteration.value)) {
        (<Promise<any>> iteration.value).then(resumeGenerator, throwGenerator);
      }
      // Generator has mistakenly returned a non-promise value.
      // Be forgiving and immediately resume execution
      else {
        resumeGenerator(iteration.value);
      }
    }

    function resumeGenerator(value: any) {
      try {
        // Resume execution
        processIteration(iterator.next(value));
      } catch(e) {
        // Catch errors that propagated out of the generator and
        // pass them along to the promise.
        reject(e);
      }
    }

    function throwGenerator(error: any) {
      try {
        // Throw an exception within the generator where it last yielded
        processIteration(iterator.throw(error));
      } catch(e) {
        reject(e);
        // Catch errors that propagated out of the generator and
        // pass them along to the promise.
      }
    }

    resumeGenerator(undefined);
  });
}

export function first<T> (iterable: Iterablish<T>): Optional<T> {
  //noinspection LoopStatementThatDoesntLoopJS
  for (let item of iterate(iterable)) {
    return Optional.of(item);
  }
  return Optional.ofNull();
}

export function *iconcat (...iterables) {
  for (let iterable of iterables) {
    for (let item of iterable) {
      yield item;
    }
  }
}

// export function first (iterable: Iterablish) {
//   // It is not a bug that this for loop returns immediately.
//   // It's a lazy way to get the first element of the iterator
//   //noinspection LoopStatementThatDoesntLoopJS
//   for (let x of iterate(iterable)) {
//     return Optional.of(x);
//   }
//   return Optional.ofNull();
// }

export function *ienumerate <V> (object: { [index: string]: V }): Iterable<[string, V]> {
  for (let key in object) {
    //noinspection JSUnfilteredForInLoop
    yield [key, object[key]];
  }
}

/**
 * Lazily applies a filter function to a sequence
 */
export function *ifilter <T> (iterable: Iterablish<T>, filterFn: FilterFn<T>) {
  let i = 0;
  for (let x of iterate(iterable)) {
    if (filterFn(x, i, iterable)) {
      yield x;
    }
    i++;
  }
}

export function *imap <T, R> (iterable: Iterablish<T>, mapFn: MapFn<T, R>) {
  let i = 0;
  for (let x of iterate(iterable)) {
    yield mapFn(x, i, iterable);
    i++;
  }
}

function hasIndexOf <T> (value: any): value is { indexOf: MapFn<T, number> } {
  return ('indexOf' in value) && (typeof value.indexOf === 'function');
}

/**
 * Locate an item in an array or other iterable
 * @param {Iterablish<T>} iterable
 * @param {anything} item
 * @param {Function(anything) -> Boolean>} fn
 *            (Optional) - Equality function to override the === operator.
 * @return {Integer|Boolean} The item's index, or false if not present
 */
export function indexOf <T> (iterable: Iterablish<T>, item, fn?: FilterFn<T>): number | boolean {
  // User-provided equality test
  if (fn !== undefined) {
    let i = 0;
    for (let x of iterate(iterable)) {
      if (fn(item, i, iterable)) {
        return i;
      } else {
        i++;
      }
    }
    return false;
  }
  // NaN's cannot be compared with the equality operator
  else if (isNaN(item)) {
    let i = 0;
    for (let x of iterate(iterable)) {
      if (isNaN(item)) {
        return i;
      } else {
        i++;
      }
    }
    return false;
  }
  // Use native array implementation if possible
//  else if (hasIndexOf(iterable)) {
//    const index = iterable.indexOf(item);
//    if (index < 0) {
//      return false;
//    } else {
//      return index;
//    }
//  }
  // Fallback to direct item equality test
  else {
    let i = 0;
    for (let x of iterate(iterable)) {
      if (item === x) {
        return i;
      }
      else {
        i++;
      }
    }
    return false;
  }
}

/**
 * Create an iterator that continuously increases in value.
 * Parameters are identical to arange(), but instead of returning an array,
 * a generator is returned instead.
 */
export function *irange <T> (
    start: number,
    end?: number
) {
  if (end === undefined) {
    end = start;
    start = 0;
  }

  for (let i = 0, val = start; val < end; i++, val++) {
    yield val;
  }
}
// export function *irange <T> (
//     a: number,
//     b?: number | RangeMapFn<T>,
//     c?: RangeMapFn<T>
// ): Iterable<T> {
//   // Parameters
//   const [start, end, fn] = parseRangeArgs(a, b, c);

//   if (fn === undefined) {
//     for (let i = 0, val = start; val < end; i++, val++) {
//       yield val;
//     }
//   }
//   else {
//     for (let i = 0, val = start; val < end; i++, val++) {
//       yield fn(val, i);
//     }
//   }
// }

/**
 * Ensure an object is iterable.
 * Some objects are "array-like" in that they have numerical keys and a
 * "length" property, but they lack the Array methods.
 * @param {Iterable|ArrayLike} iterable
 */
export function iterate <T> (iterable: Iterablish<T>): Iterable<T> {
  if (Symbol.iterator in <Iterable<T>>iterable) {
    return <Iterable<T>> iterable;
  } else if ('length' in iterable) {
    return (function *() {
      for (let i = 0; i < (<ArrayLike<T>> iterable).length; i++) {
        yield iterable[i];
      }
    })();
  } else {
    throw new TypeError(`${iterable} is not iterable`);
  }
}

export function *ivalues <V> (object: { [index: string]: V }): Iterable<V> {
  for (let key in object) {
    //noinspection JSUnfilteredForInLoop
    yield object[key];
  }
}

export function forEach <T> (iterable: Iterablish<T>, fn: Consumer<T>) {
  //noinspection JSUnusedLocalSymbols
  for (let unused of imap(iterable, fn)) {
    // no op
  }
}

/**
 * Climb an object's prototype chain, starting with the object's direct
 * prototype.
 */
export function *getPrototypes (object) {
  for (let prototype = Object.getPrototypeOf(object);
       prototype !== null;
       prototype = Object.getPrototypeOf(prototype)) {
    yield prototype;
  }
}

// export function last (iterable) {
//   // Arrays and array-like objects
//   if ('length' in iterable) {
//     return Optional.ofNullable(iterable[iterable.length - 1]);
//   }
//   // Generators and custom iterators
//   else if (Symbol.iterator in iterable) {
//     let x;
//     for (x of iterable) {}
//     return Optional.ofNullable(x);
//   }
//   else {
//     throw new TypeError(`Object ${iterable} is not iterable`);
//   }
// }

/**
 * Log an error to the console. Useful for the tail-end of Promises,
 * which tend to eat errors silently.
 */
export function logError (error) {
  if ('stack' in error) {
    console.error(error.stack);
  } else {
    console.error(error);
  }
}

/**
 * Sort a set of items from `iterable` into buckets based on a key returned
 * by mapping function `keyFn`
 *
 * @param iterable (Iterable)            The items to sort
 * @param keyFn (Function<item> -> key)  A mapping function returning which
 *                                       bucket to place the item into
 * @return (Map<key, Array<item>>)       The sorted elements
 */
export function partition<K, V> (iterable: Iterable<V>, keyFn: (item: V) => K): Map<K, V[]> {
  const ret = new Map<K, V[]>();
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
}

export function reduce <T> (
    iterable: Iterablish<T>,
    reduction: (lhs: T, rhs: T, rhsIndex?: number, iterable?: Iterablish<T>) => T,
    initial?: T
): T {
  let rhsIndex = (initial === undefined) ? 0 : 1;
  let value = initial;
  for (let nextValue of iterate(iterable)) {
    if (rhsIndex === 0) {
      value = <T> nextValue;
    } else {
      value = reduction(value, <T> nextValue, rhsIndex, iterable);
    }
    rhsIndex ++;
  }
  return value;
}

/**
 * Equivalence comparison for sets
 */
export function setsAreEqual (set1, set2) {
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
}

export function sum (iterable: Iterablish<number>): number {
  return reduce(iterate(iterable), (a, b) => a + b, 0);
}

/**
 * Repackage setTimeout() as a Promise
 */
export function timeout (milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Combine multiple iterables, yielding an array for each value
 */
export function *zip (...iterables) {
  const iterators = iterables.map(iterable => iterable[Symbol.iterator]());

  //noinspection JSUnresolvedVariable (IteratorItem::done)
  for (let iterations = iterators.map(itr => itr.next());
       !all(iterations, iteration => iteration.done);
       iterations = iterators.map(itr => itr.next())) {
    yield iterations.map(iteration => iteration.value);
  }
}
