'use strict';

const Fn = require('./Fn');

const hasOwnProperty = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

module.exports = Object.freeze({
  /** Apply anything starting with "_on_" to the current object. **/
  autoBindCallbacks (object) {
    for (let prototype of Fn.getPrototypes(object)) {
      for (let property of Object.getOwnPropertyNames(prototype)) {
        if (property.startsWith('_on_') && !hasOwnProperty(object, property)) {
          object[property] = prototype[property].bind(object);
        }
      }
    }
  },

  /*registerModelObservers (observerList, oldObservers, middle) {
    for (let observer of observerList.splice(0, Infinity)) {
      observer.cancel();
    }


  }*/
});
