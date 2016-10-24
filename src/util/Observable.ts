
function toMapSet<T> (keys: T[]): Map<T, Set<Function>> {
  const ret = new Map();
  for (let key of keys) {
    ret.set(key, new Set<Function>());
  }
  return ret;
}

export class ObserveReceipt {
  _observerSet: Set<Function>;
  _callback: Function;

  constructor (observerSet: Set<Function>,  callback: Function) {
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

export default class Observable {
  _observers: Map<Symbol, Set<Function>>;

  constructor (supportedEvents: Symbol[]) {
    if (supportedEvents === undefined) {
      throw TypeError('Require a list of supported events');
    }
    else {
      this._observers = toMapSet(supportedEvents);
    }
  }

  observe(eventType: Symbol, callback: Function): ObserveReceipt {
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

  notify(eventType: Symbol, ...msg) {
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
