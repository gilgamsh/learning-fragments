"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gotoLocation = void 0;
const vscode_1 = require("vscode");
function gotoLocation(location, metalsFileProvider) {
    var _a;
    const range = new vscode_1.Range(location.range.start.line, location.range.start.character, location.range.end.line, location.range.end.character);
    let vs = vscode_1.ViewColumn.Active;
    if (location.otherWindow) {
        vs =
            ((_a = vscode_1.window.visibleTextEditors
                .filter((vte) => {
                var _a;
                return ((_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri.scheme) != "output" &&
                    vte.viewColumn;
            })
                .pop()) === null || _a === void 0 ? void 0 : _a.viewColumn) || vscode_1.ViewColumn.Beside;
    }
    const uri = vscode_1.Uri.parse(location.uri);
    // vscode will cache the virtual documents even after closing unless onDidChange is fired
    if (uri.scheme == "metalsDecode" && metalsFileProvider) {
        metalsFileProvider.onDidChangeEmitter.fire(uri);
    }
    vscode_1.workspace.openTextDocument(uri).then((textDocument) => vscode_1.window.showTextDocument(textDocument, {
        selection: range,
        viewColumn: vs,
    }));
}
exports.gotoLocation = gotoLocation;
//# sourceMappingURL=goToLocation.js.map