function inject(cls, overrides, verbose) {
  const evalString = Object.keys(overrides)
      .map(symbolName => `const ${symbolName} = overrides['${symbolName}'];\n`)
      .join('')
    + String(cls);

  if (verbose) {
    console.log(evalString);
  }

  return eval(evalString);
}

describe('inject', ()=>{
  it('should inject a dependency', ()=>{
    const dependentFunction = jasmine.createSpy('dependentFunction');
    const injectedFunction = jasmine.createSpy('injectedFunction');

    class AClass {
      constructor() {
        dependentFunction();
      }
    }

    const InjectedClass = inject(AClass, {
      dependentFunction: injectedFunction,
    });
    new InjectedClass();

    expect(injectedFunction).toHaveBeenCalled();
    expect(dependentFunction).not.toHaveBeenCalled();
  });
  it('should inject multiple dependencies', ()=>{
    const dependentFunction1 = jasmine.createSpy('dependentFunction1');
    const dependentFunction2 = jasmine.createSpy('dependentFunction2');
    const injectedFunction1 = jasmine.createSpy('injectedFunction1');
    const injectedFunction2 = jasmine.createSpy('injectedFunction2');

    class AClass {
      constructor(a, b) {
        dependentFunction1(a);
        dependentFunction2(b);
      }
    }

    const InjectedClass = inject(AClass, {
      dependentFunction1: injectedFunction1,
      dependentFunction2: injectedFunction2,
    });
    new InjectedClass('a','b');

    expect(injectedFunction1).toHaveBeenCalledWith('a');
    expect(dependentFunction1).not.toHaveBeenCalled();
    expect(injectedFunction2).toHaveBeenCalledWith('b');
    expect(dependentFunction2).not.toHaveBeenCalled();
  });
});

