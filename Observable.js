'use strict';

class Observable {
  constructor () {
    this._observers = new Map();
  }

  observe(eventName, callback) {
    if (callback) {
      const that = this;
      if (this._observers.has(eventName)) {
        this._observers.get(eventName).add(callback);
      }
      else {
        this._observers.set(eventName, new Set([callback]));
      }
      return {
        cancel: function() {
          if (that._observers.has(eventName)) {
            const observers = that._observers.get(eventName);
            if (observers.has(callback)) {
              observers.delete(callback);
            }
            if (observers.size === 0) {
              that._observers.delete(eventName);
            }
          }
        }
      };
    }
    else {
      throw Error('Undefined callback');
    }
  }

  notify(eventName, msg) {
    if (this._observers.has(eventName)) {
      for (let observer of this._observers.get(eventName)) {
        observer(msg);
      }
    }
  }
}

describe('Observable', ()=>{
  it('should initalize', ()=>{
    new Observable();
  });

  it('should send notifications for observed events', ()=>{
    const observable = new Observable();
    const observer = jasmine.createSpy('on_event');
    const msg = {a: 'b'};
    observable.observe('event', observer);
    observable.notify('event', msg);
    expect(observer).toHaveBeenCalledWith(msg);
  });

  it('should support multiple observers for the same event', ()=>{
    const observable = new Observable();
    const observer1 = jasmine.createSpy('on_event');
    const observer2 = jasmine.createSpy('on_event');
    const msg = {a: 'b'};
    observable.observe('event', observer1);
    observable.observe('event', observer2);
    observable.notify('event', msg);
    expect(observer1).toHaveBeenCalledWith(msg);
    expect(observer2).toHaveBeenCalledWith(msg);
  });

  it('should prevent adding undefined or absent observers', ()=>{
    const observable = new Observable();
    expect(() => observable.observe('event')).toThrow();
  });

  it('should cancel notifications', ()=>{
    const observable = new Observable();
    const observer = jasmine.createSpy('on_event');
    const msg = {a: 'b'};
    const handle = observable.observe('event', observer);
    handle.cancel();
    observable.notify('event', msg);
    expect(observer).not.toHaveBeenCalled();
  });

  it('should support canceling one observer when two are observing an event', ()=>{
    const observable = new Observable();
    const observer1 = jasmine.createSpy('on_event');
    const observer2 = jasmine.createSpy('on_event');
    const msg = {a: 'b'};
    observable.observe('event', observer1);
    const handle = observable.observe('event', observer2);
    handle.cancel()
    observable.notify('event', msg);
    expect(observer1).toHaveBeenCalledWith(msg);
    expect(observer2).not.toHaveBeenCalled();
  });

  it('should support canceling all observers when two are observing an event', ()=>{
    const observable = new Observable();
    const observer1 = jasmine.createSpy('on_event');
    const observer2 = jasmine.createSpy('on_event');
    const msg = {a: 'b'};
    const handle1 = observable.observe('event', observer1);
    const handle2 = observable.observe('event', observer2);
    handle1.cancel()
    handle2.cancel()
    observable.notify('event', msg);
    expect(observer1).not.toHaveBeenCalled();
    expect(observer2).not.toHaveBeenCalled();
  });
});
