'use strict';
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
//# sourceMappingURL=bindObservers.js.map