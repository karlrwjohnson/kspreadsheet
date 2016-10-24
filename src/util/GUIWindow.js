'use strict';
module.exports = {
    _guiWindow: null,
    set window(guiWindow) {
        this._guiWindow = guiWindow;
        console = this.require('console');
    },
    require(name) {
        if (this._guiWindow === null) {
            throw Error('Window object has not been initialized yet');
        }
        else if (name in this._guiWindow) {
            return this._guiWindow[name];
        }
        else {
            throw Error(`Global ${name} is not declared in the window object`);
        }
    },
};
//# sourceMappingURL=GUIWindow.js.map