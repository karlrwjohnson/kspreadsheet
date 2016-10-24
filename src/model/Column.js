'use strict';
const Observable_1 = require('../util/Observable');
const exceptions_1 = require('../exceptions');
const WIDTH = Symbol('Column.WIDTH');
class Column extends Observable_1.default {
    constructor(json) {
        super([Column.WIDTH]);
        this._width = 10;
        if (json) {
            this.width = json.width;
        }
    }
    static get WIDTH() { return WIDTH; }
    toJSON() {
        return {
            width: this.width,
        };
    }
    get width() { return this._width; }
    set width(_) {
        if (_ <= 0) {
            throw new exceptions_1.OutOfBoundsException('Negative width');
        }
        else if (typeof _ !== 'number') {
            throw new TypeError('Width must be a number');
        }
        else {
            this._width = _;
            this.notify(Column.WIDTH);
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Column;
//# sourceMappingURL=Column.js.map