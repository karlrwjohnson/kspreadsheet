'use strict';

const Observable = require('../Observable');

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

  it('should notify multiple subscribed observers for the same event', ()=>{
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

  it('should send an arbitrary number of arguments in notifications', ()=>{
    const observable = new Observable([EVENT]);
    const observer = jasmine.createSpy('on_event');
    const msgParam1 = {a: 'b'};
    const msgParam2 = {c: 'd'};
    observable.observe(EVENT, observer);
    observable.notify(EVENT, msgParam1, msgParam2);
    expect(observer).toHaveBeenCalledWith(msgParam1, msgParam2);
  });
});
