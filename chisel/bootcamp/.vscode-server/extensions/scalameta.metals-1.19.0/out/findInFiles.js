"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeFindInFiles = exports.createFindInFilesTreeView = exports.startFindInFilesProvider = void 0;
const vscode_1 = require("vscode");
class TopLevel {
    constructor(positions, resourceUri) {
        this.positions = positions;
        this.resourceUri = resourceUri;
        this.key = "TopLevel";
    }
}
class PositionInFile {
    constructor(location, uri, label) {
        this.location = location;
        this.uri = uri;
        this.label = label;
        this.key = "PositionInFile";
    }
}
function startFindInFilesProvider(context) {
    const findInFilesProvider = new FindInFilesProvider();
    const treeDataProvider = vscode_1.window.registerTreeDataProvider("metalsFindInFiles", findInFilesProvider);
    context.subscriptions.push(treeDataProvider);
    return findInFilesProvider;
}
exports.startFindInFilesProvider = startFindInFilesProvider;
function createFindInFilesTreeView(provider, context) {
    vscode_1.commands.executeCommand("setContext", "metals.showFindInFiles", false);
    const treeView = vscode_1.window.createTreeView("metalsFindInFiles", {
        treeDataProvider: provider,
        showCollapseAll: true,
    });
    const didChangeSelection = treeView.onDidChangeSelection((e) => __awaiter(this, void 0, void 0, function* () {
        const selected = e.selection;
        if (selected.length == 1) {
            // only one element is selected
            const head = selected[0];
            switch (head.key) {
                case "TopLevel":
                    return Promise.resolve();
                case "PositionInFile": {
                    const positionInFile = head;
                    const textDocument = yield vscode_1.workspace.openTextDocument(positionInFile.uri);
                    const textEditor = yield vscode_1.window.showTextDocument(textDocument);
                    const range = positionInFile.location.range;
                    const start = new vscode_1.Position(range.start.line, range.start.character);
                    const end = new vscode_1.Position(range.end.line, range.end.character);
                    const selection = new vscode_1.Selection(end, start);
                    const vscodeRange = new vscode_1.Range(new vscode_1.Position(range.start.line, range.start.character), new vscode_1.Position(range.end.line, range.end.character));
                    textEditor.revealRange(vscodeRange, vscode_1.TextEditorRevealType.InCenter);
                    textEditor.selection = selection;
                    break;
                }
            }
        }
    }));
    context.subscriptions.push(didChangeSelection);
    return treeView;
}
exports.createFindInFilesTreeView = createFindInFilesTreeView;
function executeFindInFiles(client, provider, view, metalsFileProvider, outputChannel) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const include = yield vscode_1.window
                .showInputBox({
                prompt: "Enter file mask",
                placeHolder: ".conf",
            })
                .then((include) => {
                if (include === undefined) {
                    return Promise.reject("Undefined mask");
                }
                else if (include === "") {
                    return Promise.reject("Empty file mask");
                }
                else {
                    return include;
                }
            });
            const pattern = yield vscode_1.window
                .showInputBox({
                prompt: "Enter search pattern",
            })
                .then((pattern) => {
                if (pattern === undefined) {
                    return Promise.reject("Undefined pattern");
                }
                else if (pattern === "") {
                    return Promise.reject("Empty pattern");
                }
                else {
                    return pattern;
                }
            });
            const locations = yield client.sendRequest("metals/findTextInDependencyJars", {
                options: { include },
                query: { pattern },
            });
            vscode_1.commands.executeCommand("setContext", "metals.showFindInFiles", true);
            const newTopLevel = yield toTopLevel(locations, metalsFileProvider);
            provider.update(newTopLevel);
            if (newTopLevel.length != 0) {
                return yield view.reveal(newTopLevel[0]);
            }
            else {
                return yield Promise.resolve();
            }
        }
        catch (error) {
            outputChannel.appendLine("Error finding text in dependency jars: " + JSON.stringify(error));
        }
    });
}
exports.executeFindInFiles = executeFindInFiles;
function toTopLevel(locations, metalsFileProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        const locationsByFile = new Map();
        for (const loc of locations) {
            const previous = locationsByFile.get(loc.uri) || [];
            locationsByFile.set(loc.uri, [...previous, loc]);
        }
        return yield Promise.all(Array.from(locationsByFile, ([filePath, locations]) => __awaiter(this, void 0, void 0, function* () {
            const uri = vscode_1.Uri.parse(filePath);
            const getFileContent = () => __awaiter(this, void 0, void 0, function* () {
                if (uri.scheme == "jar") {
                    return yield metalsFileProvider.provideTextDocumentContent(uri);
                }
                else {
                    const readData = yield vscode_1.workspace.fs.readFile(uri);
                    return Buffer.from(readData).toString("utf8");
                }
            });
            const fileContent = yield getFileContent();
            if (fileContent) {
                const lines = fileContent.split(/\r?\n/);
                const newPositions = locations.reduce((arr, location) => {
                    const line = lines[location.range.start.line];
                    const newPosition = new PositionInFile(location, uri, line);
                    return [...arr, newPosition];
                }, []);
                return new TopLevel(newPositions, uri);
            }
            else {
                return new TopLevel([], uri);
            }
        })));
    });
}
class FindInFilesProvider {
    constructor() {
        this.items = [];
        this.didChange = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this.didChange.event;
    }
    getTreeItem(element) {
        switch (element.key) {
            case "TopLevel": {
                const topLevelResult = {
                    resourceUri: element.resourceUri,
                    description: element.resourceUri.path,
                    collapsibleState: vscode_1.TreeItemCollapsibleState.Expanded,
                };
                return topLevelResult;
            }
            case "PositionInFile": {
                const start = element.location.range.start;
                const end = element.location.range.end;
                const line = start.line;
                const startColumn = start.character;
                const fileName = element.uri.fsPath.split("/").pop();
                const shortDescription = fileName + ":" + (line + 1) + ":" + (startColumn + 1);
                const trimmedLabel = element.label;
                const trimmedStartCol = startColumn + trimmedLabel.length - element.label.length;
                const trimmedEndCol = end.character + trimmedLabel.length - element.label.length;
                const highlightedLabel = {
                    label: trimmedLabel,
                    highlights: [[trimmedStartCol, trimmedEndCol]],
                };
                const positionResult = {
                    label: highlightedLabel,
                    description: shortDescription,
                    resourceUri: element.uri,
                };
                return positionResult;
            }
        }
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.items);
        }
        else {
            switch (element.key) {
                case "TopLevel":
                    return Promise.resolve(element.positions);
                case "PositionInFile":
                    return Promise.resolve([]);
            }
        }
    }
    getParent(element) {
        switch (element.key) {
            case "TopLevel":
                return Promise.resolve(undefined);
            case "PositionInFile":
                return Promise.resolve(this.items.find((topLevel) => topLevel.positions.includes(element)));
        }
    }
    update(newElems) {
        this.items = newElems;
        this.didChange.fire(undefined);
    }
}
//# sourceMappingURL=findInFiles.js.map