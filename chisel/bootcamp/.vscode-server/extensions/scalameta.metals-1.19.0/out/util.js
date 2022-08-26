"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFrom = exports.getJavaHomeFromConfig = exports.getValueFromConfig = exports.executeCommand = exports.getTextDocumentPositionParams = exports.metalsDir = exports.getConfigValue = void 0;
const path = __importStar(require("path"));
const os_1 = __importDefault(require("os"));
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const https_1 = __importDefault(require("https"));
function getConfigValue(config, key) {
    const value = config.get(key);
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const { defaultValue, workspaceValue } = config.inspect(key);
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    if (value) {
        const getTarget = () => {
            if (workspaceValue && workspaceValue !== defaultValue) {
                return vscode_1.ConfigurationTarget.Workspace;
            }
            else {
                return vscode_1.ConfigurationTarget.Global;
            }
        };
        const target = getTarget();
        return { value, target };
    }
    else if (defaultValue) {
        return {
            value: defaultValue,
            target: vscode_1.ConfigurationTarget.Global,
        };
    }
}
exports.getConfigValue = getConfigValue;
function metalsDir(target) {
    var _a;
    if (target == vscode_1.ConfigurationTarget.Workspace && vscode_1.workspace.workspaceFolders) {
        const wsDir = (_a = vscode_1.workspace.workspaceFolders[0]) === null || _a === void 0 ? void 0 : _a.uri.fsPath;
        return path.join(wsDir, ".metals");
    }
    else {
        return path.join(os_1.default.homedir(), ".metals");
    }
}
exports.metalsDir = metalsDir;
function getTextDocumentPositionParams(editor) {
    const pos = editor.selection.active;
    return {
        textDocument: { uri: editor.document.uri.toString() },
        position: { line: pos.line, character: pos.character },
    };
}
exports.getTextDocumentPositionParams = getTextDocumentPositionParams;
function executeCommand(client, command, ...args) {
    return client.sendRequest(vscode_languageclient_1.ExecuteCommandRequest.type, {
        command,
        arguments: args,
    });
}
exports.executeCommand = executeCommand;
function getValueFromConfig(config, key, defaultValue) {
    const inspected = config.inspect(key);
    const fromConfig = (inspected === null || inspected === void 0 ? void 0 : inspected.workspaceValue) ||
        (inspected === null || inspected === void 0 ? void 0 : inspected.globalValue) ||
        (inspected === null || inspected === void 0 ? void 0 : inspected.defaultValue);
    return fromConfig !== null && fromConfig !== void 0 ? fromConfig : defaultValue;
}
exports.getValueFromConfig = getValueFromConfig;
function getJavaHomeFromConfig() {
    var _a, _b;
    const javaHomePath = vscode_1.workspace
        .getConfiguration("metals")
        .get("javaHome");
    if ((javaHomePath === null || javaHomePath === void 0 ? void 0 : javaHomePath.trim()) && !path.isAbsolute(javaHomePath)) {
        const pathSegments = [
            (_b = (_a = vscode_1.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.uri.fsPath,
            javaHomePath,
        ].filter((s) => s != null);
        return path.resolve(...pathSegments);
    }
    else {
        return javaHomePath;
    }
}
exports.getJavaHomeFromConfig = getJavaHomeFromConfig;
function fetchFrom(url, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const requestOptions = Object.assign({ timeout: 5000 }, options);
        const promise = new Promise((resolve, reject) => {
            https_1.default
                .get(url, requestOptions, (resp) => {
                let body = "";
                resp.on("data", (chunk) => (body += chunk));
                resp.on("end", () => resolve(body));
                resp.on("error", (e) => reject(e));
            })
                .on("error", (e) => reject(e))
                .on("timeout", () => reject(`Timeout occured during get request at ${url}`));
        });
        return yield promise;
    });
}
exports.fetchFrom = fetchFrom;
//# sourceMappingURL=util.js.map