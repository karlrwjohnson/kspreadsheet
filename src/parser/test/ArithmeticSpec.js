'use strict';

const Arithmetic = require('../../demo/Arithmetic');

describe('Arithmetic', ()=>{

  function fakeParse(expression) {
    return eval(expression
        .replace(/and/g, '&&')
        .replace(/or/g, '||')
        .replace(/not/g, '!')
        .replace(/=/g, '===')
    );
  }

  for (let expression of [
    // literals
    '1',
    '123',
    '1.23',
    '0.23',
    '.123',
    'true',
    'false',

    // negation
    '-1',
    'not true',
    'not false',

    // operators
    '1+2', '1-2',
    '3*4', '3/4',
    //'5^6' is not trivial to convert to Math.pow(5, 6) with a regex
    'true and true', 'false and false', 'true and false', 'false and true',
    'true or true',  'false or false',  'true or false',  'false or true',

    // parentheses + distributive property
    '(1)',
    '(true)',
    '(false)',
    '2*(3+4)', '(2*3)+4', '2*3+4',
    '2+(3*4)', '(2+3)*4', '2+3*4',

    // equality
    '1 = 1',
    '1 = 2',
    'true = true', 'false = false', 'true = false', 'false = true',

  ]) {
    it('should correctly parse expression "' + expression + '"', ()=>{
      expect(Arithmetic.exec(expression)).toBe(fakeParse(expression));
    });
  }

  it('should correctly parse expression "5^6"', ()=>{
    expect(Arithmetic.exec('5^6')).toBe(Math.pow(5,6));
  })
});
