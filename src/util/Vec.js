'use strict';
function equals(a, b) {
    if (a.length === b.length) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    else {
        return false;
    }
}
exports.equals = equals;
function add(a, b) {
    if (a.length === b.length) {
        return Array.from(a, (a_i, i) => a_i + b[i]);
    }
    else {
        throw Error('Vector length mismatch');
    }
}
exports.add = add;
//# sourceMappingURL=Vec.js.map