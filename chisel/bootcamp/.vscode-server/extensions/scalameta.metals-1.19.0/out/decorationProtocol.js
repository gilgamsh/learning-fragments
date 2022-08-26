"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecorationsRangesDidChange = exports.DecorationTypeDidChange = void 0;
/* eslint-disable @typescript-eslint/no-namespace */
const vscode_jsonrpc_1 = require("vscode-jsonrpc");
/**
 * This protocol is one notable exception that we can't port over to
 * metals-languageclient as it's too heavily intertwined with VS Code.
 * There is now way to move it over without bringing a significant amount of
 * code over with it from the VS Code code base which isn't a good idea.
 */
var DecorationTypeDidChange;
(function (DecorationTypeDidChange) {
    DecorationTypeDidChange.type = new vscode_jsonrpc_1.NotificationType("metals/decorationTypeDidChange");
})(DecorationTypeDidChange = exports.DecorationTypeDidChange || (exports.DecorationTypeDidChange = {}));
var DecorationsRangesDidChange;
(function (DecorationsRangesDidChange) {
    DecorationsRangesDidChange.type = new vscode_jsonrpc_1.NotificationType("metals/publishDecorations");
})(DecorationsRangesDidChange = exports.DecorationsRangesDidChange || (exports.DecorationsRangesDidChange = {}));
//# sourceMappingURL=decorationProtocol.js.map