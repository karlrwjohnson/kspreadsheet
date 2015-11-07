'use strict';

/** Apply anything starting with "_on_" to the current object. **/
function bindObservers (object) {
  for (let prototype = Object.getPrototypeOf(object);
       prototype !== null;
       prototype = Object.getPrototypeOf(prototype)) {
    for (let property of Object.getOwnPropertyNames(prototype)) {
      if (property.match(/^_on_/) && !object.hasOwnProperty(property)) {
        object[property] = prototype[property].bind(object);
      }
    }
  }
}
