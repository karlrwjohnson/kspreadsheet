'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const Fn = require('./Fn');

function stackFilename (stackEntry) {
  return stackEntry.replace(
    /^\s+at .+\((.+):\d+:\d+\)$/,
    (_, filename) => filename
  );
}

/**
 * Dependency injector which hooks into the require() system.
 *
 * A module is loaded such that calls to require() may be overridden to return
 * custom values.
 *
 * @param modulePath {String} Relative path to the desired module. Use as if
 *                            with require()
 * @param overrides {Object} Key/Value pairs where the key is the path to
 *                           override (as it appears in the target file), and
 *                           the value is the item to return instead.
 */
module.exports = function injectRequire(modulePath, overrides) {
  // Hack to get the path to the required file relative to
  const stackTrace = (new Error()).stack.split('\n');

  const thisDir = path.dirname(stackFilename(stackTrace[1]));

  const callerPath = stackFilename(stackTrace[2]);
  const callerDir = path.dirname(callerPath);

  const relativeModulePath = path.join(path.relative(thisDir, callerDir), modulePath);
  const relativeModuleDir = path.dirname(relativeModulePath);
  const absoluteModulePath = require.resolve(relativeModulePath);

  const sandboxObject = Object.create(global);

  // Normalize all paths before comparing strings to hopefully avoid subtle bugs
  const normedOverrides = {};
  for (let originalPath in overrides) {
    //noinspection JSUnfilteredForInLoop
    normedOverrides[path.normalize(originalPath)] = overrides[originalPath];
  }

  // Keep track of which overrides are used. The user might have spelled a path
  // incorrectly.
  const usedOverrides = new Set();

  sandboxObject.require = function(requirePath) {
    const normedRequirePath = path.normalize(requirePath);

    if (normedRequirePath in normedOverrides) {
      usedOverrides.add(normedRequirePath);
      return normedOverrides[normedRequirePath];
    }
    else {
      const newPath = path.join(relativeModuleDir, requirePath);
      return require(newPath);
    }
  };

  sandboxObject.module = {
    exports: {}
  };

  vm.runInNewContext(
    fs.readFileSync(absoluteModulePath),  // code
    Object.create(sandboxObject),   // context
    {                           // options
      filename: absoluteModulePath,
    }
  );

  const unusedOverrides = Object.keys(normedOverrides).filter(pathname => usedOverrides.has(pathname));
  if (unusedOverrides.length > 0) {
    console.warn("The following overrides do not appear to have been used:\n - " +
      unusedOverrides.join('\n - ')
    );
  }

  return sandboxObject.module.exports;
};
