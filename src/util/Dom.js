'use strict';

const Fn = require('./Fn');

let document = null;
let HTMLElement = null;

function domFactoryFactory (elementName) {
  return function domFactory () {
    if (document === null) {
      throw Error('Dom library has not been initialized with a document ' +
        'object. Please assign one to the "document" property.');
    }
    else {
      const args = arguments;
      const element = document.createElement(elementName);
      for (let arg of args) {
        if (arg instanceof HTMLElement) {
          element.appendChild(arg);
        }
        else if (typeof arg === 'object') {
          for (let attr in arg) {
            //noinspection JSUnfilteredForInLoop - user might want to use inheritance
            element.setAttribute(attr, arg[attr]);
          }
        }
        else if (typeof arg === 'string') {
          element.appendChild(document.createTextNode(arg));
        }
        else {
          throw Error(`Unknown argument type ${arg}`)
        }
      }
      return element;
    }
  }
}

module.exports = Object.freeze({
  get document () {
    return document;
  },
  set document (_document) {
    document = _document;

    HTMLElement = Fn.first(
      Fn.filter(
        Fn.getConstructors(document.createElement('div')),
        ctor => ctor.name === 'HTMLElement'
      )
    ).orElseThrow(new Error('Cannot produce a HTMLElement class from document object'));
  },

  a        : domFactoryFactory('a'),
  aside    : domFactoryFactory('aside'),
  button   : domFactoryFactory('button'),
  col      : domFactoryFactory('col'),
  colgroup : domFactoryFactory('colgroup'),
  div      : domFactoryFactory('div'),
  form     : domFactoryFactory('form'),
  h1       : domFactoryFactory('h1'),
  h2       : domFactoryFactory('h2'),
  h3       : domFactoryFactory('h3'),
  h4       : domFactoryFactory('h4'),
  h5       : domFactoryFactory('h5'),
  h6       : domFactoryFactory('h6'),
  h7       : domFactoryFactory('h7'),
  header   : domFactoryFactory('header'),
  img      : domFactoryFactory('img'),
  input    : domFactoryFactory('input'),
  li       : domFactoryFactory('li'),
  main     : domFactoryFactory('main'),
  nav      : domFactoryFactory('nav'),
  ol       : domFactoryFactory('ol'),
  option   : domFactoryFactory('option'),
  p        : domFactoryFactory('p'),
  select   : domFactoryFactory('select'),
  span     : domFactoryFactory('span'),
  table    : domFactoryFactory('table'),
  tbody    : domFactoryFactory('tbody'),
  td       : domFactoryFactory('td'),
  th       : domFactoryFactory('th'),
  thead    : domFactoryFactory('thead'),
  tr       : domFactoryFactory('tr'),
  ul       : domFactoryFactory('ul'),

  removeChildren (element) {
    for (let i of Array.from(element.childNodes)) {
      element.removeChild(i);
    }
  },

  insertChildAtIndex (parent, index, child) {
    // "|| null" converts undefineds to nulls.
    // Node.insertBefore() interprets null nextSiblings as "append at the end"
    const nextSibling = parent.children[index] || null;
    return parent.insertBefore(child, nextSibling);
  },

  removeChildAtIndex (parent, index) {
    return parent.removeChild(parent.children[index]);
  },

  getIndexOfElementInParent(element) {
    return Fn.indexOf(element.parentElement.children, element);
  },
});
