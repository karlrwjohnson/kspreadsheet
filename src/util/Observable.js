'use strict';

class Observable {
  constructor (supportedEvents) {
    if (supportedEvents === undefined) {
      throw TypeError('Require a list of supported events');
    }
    else {
      this._observers = new Map(supportedEvents.map(type => [type, new Set()]));
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
      process.stdout.write((new Error()).stack);
      throw TypeError('Unsupported event type ' + eventType.toString());
    }
    else {
      this._observers.get(eventType).add(callback);
      return {
        cancel: function() {
          that._observers.get(eventType).delete(callback);
        }
      }
    }
  }

  notify(eventType, ...msg) {
    if (!this._observers.has(eventType)) {
      throw TypeError('Unsupported event type ' + eventType);
    }
    else {
      for (let observer of this._observers.get(eventType)) {
        observer(...msg);
      }
    }
  }
}

module.exports = Observable;
