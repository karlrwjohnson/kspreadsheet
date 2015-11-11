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
    if (!callback) {
      throw Error('Undefined callback');
    }
    else if (!this._observers.has(eventType)) {
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

  notify(eventType, msg) {
    if (!this._observers.has(eventType)) {
      throw TypeError('Unsupported event type ' + eventType);
    }
    else {
      for (let observer of this._observers.get(eventType)) {
        observer(msg);
      }
    }
  }
}

describe('Observable', ()=>{
  const EVENT = Symbol('EVENT');

  let observable;

  it('should initalize', ()=>{
    new Observable([]);
  });

  it('should send notifications for observed events', ()=>{
    const observable = new Observable([EVENT]);
    const observer = jasmine.createSpy('on_event');
    const msg = {a: 'b'};
    observable.observe(EVENT, observer);
    observable.notify(EVENT, msg);
    expect(observer).toHaveBeenCalledWith(msg);
  });

  it('should support multiple observers for the same event', ()=>{
    const observable = new Observable([EVENT]);
    const observer1 = jasmine.createSpy('on_event');
    const observer2 = jasmine.createSpy('on_event');
    const msg = {a: 'b'};
    observable.observe(EVENT, observer1);
    observable.observe(EVENT, observer2);
    observable.notify(EVENT, msg);
    expect(observer1).toHaveBeenCalledWith(msg);
    expect(observer2).toHaveBeenCalledWith(msg);
  });

  it('should prevent adding undefined or absent observers', ()=>{
    const observable = new Observable([EVENT]);
    expect(() => observable.observe(EVENT)).toThrow();
  });

  it('should cancel notifications', ()=>{
    const observable = new Observable([EVENT]);
    const observer = jasmine.createSpy('on_event');
    const msg = {a: 'b'};
    const handle = observable.observe(EVENT, observer);
    handle.cancel();
    observable.notify(EVENT, msg);
    expect(observer).not.toHaveBeenCalled();
  });

  it('should support canceling one observer when two are observing an event', ()=>{
    const observable = new Observable([EVENT]);
    const observer1 = jasmine.createSpy('on_event');
    const observer2 = jasmine.createSpy('on_event');
    const msg = {a: 'b'};
    observable.observe(EVENT, observer1);
    const handle = observable.observe(EVENT, observer2);
    handle.cancel()
    observable.notify(EVENT, msg);
    expect(observer1).toHaveBeenCalledWith(msg);
    expect(observer2).not.toHaveBeenCalled();
  });

  it('should support canceling all observers when two are observing an event', ()=>{
    const observable = new Observable([EVENT]);
    const observer1 = jasmine.createSpy('on_event');
    const observer2 = jasmine.createSpy('on_event');
    const msg = {a: 'b'};
    const handle1 = observable.observe(EVENT, observer1);
    const handle2 = observable.observe(EVENT, observer2);
    handle1.cancel()
    handle2.cancel()
    observable.notify(EVENT, msg);
    expect(observer1).not.toHaveBeenCalled();
    expect(observer2).not.toHaveBeenCalled();
  });
});
