'use strict';
const Fn = require('./fn');
const hasOwnProperty = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
/** Apply anything starting with "_on_" to the current object. **/
function bindObservers(object) {
    for (let prototype = Object.getPrototypeOf(object); prototype !== null; prototype = Object.getPrototypeOf(prototype)) {
        for (let property of Object.getOwnPropertyNames(prototype)) {
            if (property.match(/^_on_/) && !hasOwnProperty(object, property)) {
                object[property] = prototype[property].bind(object);
            }
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = bindObservers;
/** Apply anything starting with "_on_" to the current object. **/
function autoBindCallbacks(object) {
    for (let prototype of Fn.getPrototypes(object)) {
        for (let property of Object.getOwnPropertyNames(prototype)) {
            if (property.startsWith('_on_') && !hasOwnProperty(object, property)) {
                object[property] = prototype[property].bind(object);
            }
        }
    }
}
exports.autoBindCallbacks = autoBindCallbacks;
/*registerModelObservers (observerList, oldObservers, middle) {
  for (let observer of observerList.splice(0, Infinity)) {
    observer.cancel();
  }


}*/
//# sourceMappingURL=ObserverTools.js.map