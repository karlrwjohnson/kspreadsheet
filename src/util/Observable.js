"use strict";
function toMapSet(keys) {
    const ret = new Map();
    for (let key of keys) {
        ret.set(key, new Set());
    }
    return ret;
}
class ObserveReceipt {
    constructor(observerSet, callback) {
        this._observerSet = observerSet;
        this._callback = callback;
    }
    cancel() {
        if (this._observerSet) {
            this._observerSet.delete(this._callback);
            this._observerSet = null;
            this._callback = null;
        }
    }
}
exports.ObserveReceipt = ObserveReceipt;
class Observable {
    constructor(supportedEvents) {
        if (supportedEvents === undefined) {
            throw TypeError('Require a list of supported events');
        }
        else {
            this._observers = toMapSet(supportedEvents);
        }
    }
    observe(eventType, callback) {
        const that = this;
        if (eventType === undefined) {
            throw Error('Undefined event type');
        }
        else if (!callback) {
            throw Error('Undefined callback');
        }
        else if (!this._observers.has(eventType)) {
            throw TypeError('Unsupported event type ' + eventType.toString());
        }
        else {
            this._observers.get(eventType).add(callback);
            return new ObserveReceipt(this._observers.get(eventType), callback);
        }
    }
    notify(eventType, ...msg) {
        if (this._observers.has(eventType)) {
            for (let observer of this._observers.get(eventType)) {
                observer(...msg);
            }
        }
        else {
            throw TypeError('Unsupported event type ' + eventType.toString());
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Observable;
//# sourceMappingURL=Observable.js.map