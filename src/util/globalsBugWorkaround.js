'use strict';

module.exports = function globalsBugWorkaround (guiWindow) {
  console = guiWindow.console;
};
