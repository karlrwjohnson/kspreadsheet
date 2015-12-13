'use strict';

const Fn = require('../Fn');
const Optional = require('../../Optional');

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
