"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openSymbolSearch = void 0;
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
const goToLocation_1 = require("./goToLocation");
class SymbolItem {
    constructor(si, workspace) {
        const icon = symbolKindIcon(si.kind);
        this.label = `$(symbol-${icon}) ${si.name}`;
        this.description = si.containerName;
        if (workspace) {
            const path = vscode_1.Uri.parse(si.location.uri.toString()).path;
            if (this.label.indexOf("Add ';' to search library dependencies") < 0) {
                this.detail = path.replace(workspace.path, "");
            }
        }
        this.alwaysShow = true;
        this.location = node_1.Location.create(si.location.uri.toString(), si.location.range);
    }
}
function openSymbolSearch(client, metalsFileProvider, workspace) {
    var _a, _b;
    const inputBox = vscode_1.window.createQuickPick();
    inputBox.placeholder =
        "Examples: `List`, `s.c.i.List`, `List;`(include dependencies)";
    inputBox.matchOnDetail = false;
    inputBox.matchOnDescription = false;
    const activeTextEditor = vscode_1.window.activeTextEditor;
    const wordRange = (_a = activeTextEditor === null || activeTextEditor === void 0 ? void 0 : activeTextEditor.document) === null || _a === void 0 ? void 0 : _a.getWordRangeAtPosition(activeTextEditor === null || activeTextEditor === void 0 ? void 0 : activeTextEditor.selection.active);
    const wordUnderCursor = wordRange && ((_b = activeTextEditor === null || activeTextEditor === void 0 ? void 0 : activeTextEditor.document) === null || _b === void 0 ? void 0 : _b.getText(wordRange));
    if (wordUnderCursor) {
        inputBox.value = wordUnderCursor;
    }
    let cancelToken = null;
    inputBox.onDidChangeValue(() => {
        if (cancelToken) {
            cancelToken.cancel();
        }
        cancelToken = new vscode_1.CancellationTokenSource();
        client
            .sendRequest("workspace/symbol", { query: inputBox.value }, cancelToken.token)
            .then((v) => {
            const symbols = v;
            const items = symbols.map((si) => new SymbolItem(si, workspace));
            inputBox.items = items;
        });
    });
    inputBox.onDidAccept(() => {
        const location = inputBox.activeItems[0].location;
        const windowLocation = {
            uri: location.uri,
            range: location.range,
            otherWindow: false,
        };
        inputBox.dispose();
        (0, goToLocation_1.gotoLocation)(windowLocation, metalsFileProvider);
    });
    inputBox.show();
}
exports.openSymbolSearch = openSymbolSearch;
function symbolKindIcon(kind) {
    switch (kind - 1) {
        case vscode_1.SymbolKind.File:
            return "file";
        case vscode_1.SymbolKind.Module:
            return "module";
        case vscode_1.SymbolKind.Namespace:
            return "namespace";
        case vscode_1.SymbolKind.Package:
            return "package";
        case vscode_1.SymbolKind.Class:
            return "class";
        case vscode_1.SymbolKind.Method:
            return "method";
        case vscode_1.SymbolKind.Property:
            return "property";
        case vscode_1.SymbolKind.Field:
            return "field";
        case vscode_1.SymbolKind.Constructor:
            return "constructor";
        case vscode_1.SymbolKind.Enum:
            return "enum";
        case vscode_1.SymbolKind.Interface:
            return "interface";
        case vscode_1.SymbolKind.Function:
            return "function";
        case vscode_1.SymbolKind.Variable:
            return "variable";
        case vscode_1.SymbolKind.Constant:
            return "constant";
        case vscode_1.SymbolKind.String:
            return "string";
        case vscode_1.SymbolKind.Number:
            return "number";
        case vscode_1.SymbolKind.Boolean:
            return "boolean";
        case vscode_1.SymbolKind.Array:
            return "array";
        case vscode_1.SymbolKind.Object:
            return "object";
        case vscode_1.SymbolKind.Key:
            return "key";
        case vscode_1.SymbolKind.Null:
            return "null";
        case vscode_1.SymbolKind.EnumMember:
            return "enum-member";
        case vscode_1.SymbolKind.Struct:
            return "struct";
        case vscode_1.SymbolKind.Event:
            return "event";
        case vscode_1.SymbolKind.Operator:
            return "operator";
        case vscode_1.SymbolKind.TypeParameter:
            return "type-parameter";
        default:
            return "file";
    }
}
//# sourceMappingURL=openSymbolSearch.js.map