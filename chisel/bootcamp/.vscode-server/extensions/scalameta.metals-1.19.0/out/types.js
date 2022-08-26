"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRight = exports.makeLeft = void 0;
function makeLeft(t) {
    return { kind: "left", value: t };
}
exports.makeLeft = makeLeft;
function makeRight(t) {
    return { kind: "right", value: t };
}
exports.makeRight = makeRight;
//# sourceMappingURL=types.js.map