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
exports.decodeAndShowFile = exports.MetalsFileProvider = void 0;
const metals_languageclient_1 = require("metals-languageclient");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const util_1 = require("./util");
class MetalsFileProvider {
    constructor(client) {
        this.onDidChangeEmitter = new vscode_1.EventEmitter();
        this.onDidChange = this.onDidChangeEmitter.event;
        this.client = client;
    }
    provideTextDocumentContent(uri) {
        const output = this.client
            .sendRequest(vscode_languageclient_1.ExecuteCommandRequest.type, {
            command: metals_languageclient_1.ServerCommands.DecodeFile,
            // skip encoding - jar:file: gets too aggressively encoded
            arguments: [uri.toString(true)],
        })
            .then((result) => {
            const { value, error } = result;
            if (value != null) {
                return value;
            }
            else {
                return error;
            }
        });
        return output;
    }
}
exports.MetalsFileProvider = MetalsFileProvider;
function decodeAndShowFile(client, metalsFileProvider, uri, decodeExtension) {
    return __awaiter(this, void 0, void 0, function* () {
        // returns an active editor uri, fallbacks to currently active file
        function uriWithFallback() {
            if (uri) {
                return uri;
            }
            else {
                // no uri supplied, search for current active file
                const editor = vscode_1.window.visibleTextEditors.find((e) => (0, metals_languageclient_1.isSupportedLanguage)(e.document.languageId) ||
                    e.document.fileName.endsWith(decodeExtension));
                return editor === null || editor === void 0 ? void 0 : editor.document.uri;
            }
        }
        const currentUri = uriWithFallback();
        if (currentUri) {
            let uriWithParams = undefined;
            // refreshing an already opened virtual document
            // uri is already in a form accepted by the decode file command, there is no need to changes
            if (currentUri.scheme === "metalsDecode") {
                uriWithParams = currentUri;
            }
            else {
                let uriToResource = undefined;
                // for tasty, javap and CFR we must translate scala path to .tasty or .class one
                if (currentUri.path.endsWith(".scala") &&
                    (decodeExtension === "cfr" ||
                        decodeExtension === "javap" ||
                        decodeExtension === "javap-verbose" ||
                        decodeExtension === "tasty-decoded")) {
                    const { value } = yield (0, util_1.executeCommand)(client, "metals.choose-class", {
                        textDocument: { uri: currentUri.toString() },
                        kind: decodeExtension === "tasty-decoded" ? "tasty" : "class",
                    });
                    if (value) {
                        uriToResource = vscode_1.Uri.parse(value);
                    }
                }
                else {
                    uriToResource = currentUri;
                }
                if (uriToResource) {
                    uriWithParams = vscode_1.Uri.parse(`metalsDecode:${uriToResource.toString()}.${decodeExtension}`);
                }
            }
            if (uriWithParams) {
                // VSCode by default caches the output and won't refresh it
                metalsFileProvider.onDidChangeEmitter.fire(uriWithParams);
                const doc = yield vscode_1.workspace.openTextDocument(uriWithParams);
                yield vscode_1.window.showTextDocument(doc, { preview: false });
            }
        }
    });
}
exports.decodeAndShowFile = decodeAndShowFile;
//# sourceMappingURL=metalsContentProvider.js.map