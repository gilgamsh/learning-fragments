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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path = __importStar(require("path"));
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
const lazyProgress_1 = require("./lazyProgress");
const fs = __importStar(require("fs"));
const metals_languageclient_1 = require("metals-languageclient");
const metalsLanguageClient = __importStar(require("metals-languageclient"));
const treeview_1 = require("./treeview");
const scalaDebugger = __importStar(require("./scalaDebugger"));
const decorationProtocol_1 = require("./decorationProtocol");
const timers_1 = require("timers");
const indentPattern_1 = require("./indentPattern");
const goToLocation_1 = require("./goToLocation");
const openSymbolSearch_1 = require("./openSymbolSearch");
const findInFiles_1 = require("./findInFiles");
const ext = __importStar(require("./hoverExtension"));
const metalsContentProvider_1 = require("./metalsContentProvider");
const util_1 = require("./util");
const testManager_1 = require("./testExplorer/testManager");
const workbenchCommands = __importStar(require("./workbenchCommands"));
const getServerVersion_1 = require("./getServerVersion");
const mirrors_1 = require("./mirrors");
const doctor_1 = require("./doctor");
const releaseNotesProvider_1 = require("./releaseNotesProvider");
const installJavaAction_1 = require("./installJavaAction");
const consts_1 = require("./consts");
const outputChannel = vscode_1.window.createOutputChannel("Metals");
const downloadJava = "Download Java";
let treeViews;
let currentClient;
// Inline needs to be first to be shown always first
const inlineDecorationType = vscode_1.window.createTextEditorDecorationType({
    rangeBehavior: vscode_1.DecorationRangeBehavior.OpenOpen,
});
const decorationType = vscode_1.window.createTextEditorDecorationType({
    isWholeLine: true,
    rangeBehavior: vscode_1.DecorationRangeBehavior.OpenClosed,
});
const config = vscode_1.workspace.getConfiguration("metals");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverVersion = (0, getServerVersion_1.getServerVersion)(config);
        detectLaunchConfigurationChanges();
        configureSettingsDefaults();
        yield vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Window,
            title: `Starting Metals server...`,
            cancellable: false,
        }, () => __awaiter(this, void 0, void 0, function* () {
            vscode_1.commands.executeCommand("setContext", "metals:enabled", true);
            try {
                const javaHome = yield (0, metals_languageclient_1.getJavaHome)((0, util_1.getJavaHomeFromConfig)());
                yield fetchAndLaunchMetals(context, javaHome, serverVersion);
            }
            catch (err) {
                outputChannel.appendLine(`${err}`);
                (0, installJavaAction_1.showMissingJavaAction)(outputChannel);
            }
        }));
        yield (0, releaseNotesProvider_1.showReleaseNotes)("onExtensionStart", context, serverVersion, outputChannel);
    });
}
exports.activate = activate;
function deactivate() {
    return currentClient === null || currentClient === void 0 ? void 0 : currentClient.stop();
}
exports.deactivate = deactivate;
function fetchAndLaunchMetals(context, javaHome, serverVersion) {
    var _a;
    if (!vscode_1.workspace.workspaceFolders) {
        outputChannel.appendLine(`Metals will not start because you've opened a single file and not a project directory.`);
        return;
    }
    outputChannel.appendLine(`Java home: ${javaHome}`);
    outputChannel.appendLine(`Metals version: ${serverVersion}`);
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const serverProperties = config.get("serverProperties");
    const customRepositories = config.get("customRepositories");
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    const coursierMirror = (0, mirrors_1.getCoursierMirrorPath)(config);
    const javaConfig = (0, metals_languageclient_1.getJavaConfig)({
        workspaceRoot: (_a = vscode_1.workspace.workspaceFolders[0]) === null || _a === void 0 ? void 0 : _a.uri.fsPath,
        javaHome,
        customRepositories,
        coursierMirrorFilePath: coursierMirror,
        extensionPath: context.extensionPath,
    });
    const fetchProcess = (0, metals_languageclient_1.fetchMetals)({
        serverVersion,
        serverProperties,
        javaConfig,
    });
    const title = `Downloading Metals v${serverVersion}`;
    return trackDownloadProgress(title, outputChannel, fetchProcess).then((classpath) => {
        return launchMetals(outputChannel, context, classpath, serverProperties, javaConfig, serverVersion);
    }, (reason) => {
        if (reason instanceof Error) {
            outputChannel.appendLine("Downloading Metals failed with the following:");
            outputChannel.appendLine(reason.message);
        }
        const msg = (() => {
            const proxy = `See https://scalameta.org/metals/docs/editors/vscode/#http-proxy for instructions ` +
                `if you are using an HTTP proxy.`;
            if (process.env.FLATPAK_SANDBOX_DIR) {
                return (`Failed to download Metals. It seems you are running Visual Studio Code inside the ` +
                    `Flatpak sandbox, which is known to interfere with the download of Metals. ` +
                    `Please, try running Visual Studio Code without Flatpak.`);
            }
            else {
                return (`Failed to download Metals, make sure you have an internet connection, ` +
                    `the Metals version '${serverVersion}' is correct and the Java Home '${javaHome}' is valid. ` +
                    `You can configure the Metals version and Java Home in the settings.` +
                    proxy);
            }
        })();
        outputChannel.show();
        vscode_1.window
            .showErrorMessage(msg, consts_1.openSettingsAction, downloadJava)
            .then((choice) => {
            if (choice === consts_1.openSettingsAction) {
                vscode_1.commands.executeCommand(workbenchCommands.openSettings);
            }
            else if (choice === downloadJava) {
                (0, installJavaAction_1.showInstallJavaAction)(outputChannel);
            }
        });
    });
}
function launchMetals(outputChannel, context, metalsClasspath, serverProperties, javaConfig, serverVersion) {
    // Make editing Scala docstrings slightly nicer.
    enableScaladocIndentation();
    const serverOptions = (0, metals_languageclient_1.getServerOptions)({
        metalsClasspath,
        serverProperties,
        javaConfig,
        clientName: "vscode",
    });
    const initializationOptions = {
        compilerOptions: {
            completionCommand: "editor.action.triggerSuggest",
            overrideDefFormat: "unicode",
            parameterHintsCommand: "editor.action.triggerParameterHints",
        },
        copyWorksheetOutputProvider: true,
        decorationProvider: true,
        inlineDecorationProvider: true,
        debuggingProvider: true,
        doctorProvider: "html",
        didFocusProvider: true,
        executeClientCommandProvider: true,
        globSyntax: "vscode",
        icons: "vscode",
        inputBoxProvider: true,
        isVirtualDocumentSupported: true,
        openFilesOnRenameProvider: true,
        openNewWindowProvider: true,
        quickPickProvider: true,
        slowTaskProvider: true,
        statusBarProvider: "on",
        treeViewProvider: true,
        testExplorerProvider: true,
        commandInHtmlFormat: "vscode",
        doctorVisibilityProvider: true,
    };
    const clientOptions = {
        documentSelector: [
            { scheme: "file", language: "scala" },
            { scheme: "file", language: "java" },
            { scheme: "jar", language: "scala" },
            { scheme: "jar", language: "java" },
        ],
        synchronize: {
            configurationSection: "metals",
        },
        revealOutputChannelOn: node_1.RevealOutputChannelOn.Never,
        outputChannel: outputChannel,
        initializationOptions,
        middleware: {
            provideHover: hoverLinksMiddlewareHook,
        },
        markdown: {
            isTrusted: true,
        },
    };
    function hoverLinksMiddlewareHook(document, position, token) {
        var _a;
        const editor = vscode_1.window.activeTextEditor;
        const pos = client.code2ProtocolConverter.asPosition(position);
        const range = ((_a = editor === null || editor === void 0 ? void 0 : editor.selection) === null || _a === void 0 ? void 0 : _a.contains(position))
            ? client.code2ProtocolConverter.asRange(editor.selection)
            : undefined;
        return client
            .sendRequest(ext.hover, {
            textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(document),
            position: pos,
            range: range,
        }, token)
            .then((result) => {
            return client.protocol2CodeConverter.asHover(result);
        }, () => {
            return Promise.resolve(null);
        });
    }
    const client = new node_1.LanguageClient("metals", "Metals", serverOptions, clientOptions);
    currentClient = client;
    function registerCommand(command, callback) {
        context.subscriptions.push(vscode_1.commands.registerCommand(command, callback));
    }
    function registerTextEditorCommand(command, callback) {
        context.subscriptions.push(vscode_1.commands.registerTextEditorCommand(command, callback));
    }
    function registerTextDocumentContentProvider(scheme, provider) {
        context.subscriptions.push(vscode_1.workspace.registerTextDocumentContentProvider(scheme, provider));
    }
    const metalsFileProvider = new metalsContentProvider_1.MetalsFileProvider(client);
    registerTextDocumentContentProvider("metalsDecode", metalsFileProvider);
    registerTextDocumentContentProvider("jar", metalsFileProvider);
    registerCommand("metals.show-cfr", (uri) => __awaiter(this, void 0, void 0, function* () {
        yield (0, metalsContentProvider_1.decodeAndShowFile)(client, metalsFileProvider, uri, "cfr");
    }));
    registerCommand("metals.show-javap-verbose", (uri) => __awaiter(this, void 0, void 0, function* () {
        yield (0, metalsContentProvider_1.decodeAndShowFile)(client, metalsFileProvider, uri, "javap-verbose");
    }));
    registerCommand("metals.show-javap", (uri) => __awaiter(this, void 0, void 0, function* () {
        yield (0, metalsContentProvider_1.decodeAndShowFile)(client, metalsFileProvider, uri, "javap");
    }));
    registerCommand("metals.show-semanticdb-compact", (uri) => __awaiter(this, void 0, void 0, function* () {
        yield (0, metalsContentProvider_1.decodeAndShowFile)(client, metalsFileProvider, uri, "semanticdb-compact");
    }));
    registerCommand("metals.show-semanticdb-detailed", (uri) => __awaiter(this, void 0, void 0, function* () {
        yield (0, metalsContentProvider_1.decodeAndShowFile)(client, metalsFileProvider, uri, "semanticdb-detailed");
    }));
    registerCommand("metals.show-semanticdb-proto", (uri) => __awaiter(this, void 0, void 0, function* () {
        yield (0, metalsContentProvider_1.decodeAndShowFile)(client, metalsFileProvider, uri, "semanticdb-proto");
    }));
    registerCommand("metals.show-tasty", (uri) => __awaiter(this, void 0, void 0, function* () {
        yield (0, metalsContentProvider_1.decodeAndShowFile)(client, metalsFileProvider, uri, "tasty-decoded");
    }));
    registerCommand("metals.restartServer", (0, metals_languageclient_1.restartServer)(
    // NOTE(gabro): this is due to mismatching versions of vscode-languageserver-protocol
    // which are not trivial to fix, currently
    client, vscode_1.window));
    registerCommand("metals.show-release-notes", () => __awaiter(this, void 0, void 0, function* () {
        return yield (0, releaseNotesProvider_1.showReleaseNotes)("onUserDemand", context, serverVersion, outputChannel);
    }));
    return client.start().then(() => {
        var _a, _b;
        const doctorProvider = new doctor_1.DoctorProvider(client);
        let stacktrace;
        function getStacktracePanel() {
            if (!stacktrace) {
                stacktrace = vscode_1.window.createWebviewPanel("metals-stacktrace", "Analyze Stacktrace", vscode_1.ViewColumn.Beside, { enableCommandUris: true });
                context.subscriptions.push(stacktrace);
                stacktrace.onDidDispose(() => {
                    stacktrace = undefined;
                });
            }
            stacktrace.reveal();
            return stacktrace;
        }
        [
            metals_languageclient_1.ServerCommands.BuildImport,
            metals_languageclient_1.ServerCommands.BuildRestart,
            metals_languageclient_1.ServerCommands.BuildConnect,
            metals_languageclient_1.ServerCommands.BuildDisconnect,
            metals_languageclient_1.ServerCommands.GenerateBspConfig,
            metals_languageclient_1.ServerCommands.BspSwitch,
            metals_languageclient_1.ServerCommands.SourcesScan,
            metals_languageclient_1.ServerCommands.CascadeCompile,
            metals_languageclient_1.ServerCommands.CleanCompile,
            metals_languageclient_1.ServerCommands.CancelCompilation,
            metals_languageclient_1.ServerCommands.AmmoniteStart,
            metals_languageclient_1.ServerCommands.AmmoniteStop,
        ].forEach((command) => {
            registerCommand("metals." + command, () => __awaiter(this, void 0, void 0, function* () { return client.sendRequest(node_1.ExecuteCommandRequest.type, { command: command }); }));
        });
        registerCommand(`metals.${metals_languageclient_1.ServerCommands.DoctorRun}`, () => __awaiter(this, void 0, void 0, function* () {
            yield doctorProvider.runDoctor();
        }));
        function displayBuildTarget(target) {
            const workspaceRoots = vscode_1.workspace.workspaceFolders;
            if (workspaceRoots && workspaceRoots.length > 0) {
                const uriStr = `metalsDecode:file:///${workspaceRoots[0].name}/${target}.metals-buildtarget`;
                const uri = vscode_1.Uri.parse(uriStr);
                vscode_1.workspace
                    .openTextDocument(uri)
                    .then((textDocument) => vscode_1.window.showTextDocument(textDocument));
            }
        }
        registerCommand(`metals.target-info-display`, (...args) => __awaiter(this, void 0, void 0, function* () {
            if (args.length > 0) {
                // get build target name from treeview uri of the form "projects:file:/root/metals/.mtags/?id=mtags3!/_root_/"
                const treeViewUri = args[0];
                const query = treeViewUri.split("/?id=");
                if (query.length > 1) {
                    const buildTarget = query[1].split("!");
                    if (buildTarget.length > 0) {
                        displayBuildTarget(buildTarget[0]);
                    }
                }
            }
            else {
                // pick from list of targets
                const targets = yield client.sendRequest(node_1.ExecuteCommandRequest.type, {
                    command: metals_languageclient_1.ServerCommands.ListBuildTargets,
                });
                const picked = yield vscode_1.window.showQuickPick(targets);
                if (picked) {
                    displayBuildTarget(picked);
                }
            }
        }));
        let channelOpen = false;
        registerCommand(metals_languageclient_1.ClientCommands.FocusDiagnostics, () => vscode_1.commands.executeCommand(workbenchCommands.focusDiagnostics));
        registerCommand(metals_languageclient_1.ClientCommands.RunDoctor, () => vscode_1.commands.executeCommand(metals_languageclient_1.ClientCommands.RunDoctor));
        registerCommand(metals_languageclient_1.ClientCommands.ToggleLogs, () => {
            if (channelOpen) {
                client.outputChannel.hide();
                channelOpen = false;
            }
            else {
                client.outputChannel.show(true);
                channelOpen = true;
            }
        });
        registerCommand(metals_languageclient_1.ClientCommands.StartDebugSession, (...args) => {
            scalaDebugger.start(false, ...args).then((wasStarted) => {
                if (!wasStarted) {
                    vscode_1.window.showErrorMessage("Debug session not started");
                }
            });
        });
        registerCommand(metals_languageclient_1.ClientCommands.StartRunSession, (...args) => {
            scalaDebugger.start(true, ...args).then((wasStarted) => {
                if (!wasStarted) {
                    vscode_1.window.showErrorMessage("Run session not started");
                }
            });
        });
        // should be the compilation of a currently opened file
        // but some race conditions may apply
        const compilationDoneEmitter = new vscode_1.EventEmitter();
        const codeLensRefresher = {
            onDidChangeCodeLenses: compilationDoneEmitter.event,
            provideCodeLenses: () => undefined,
        };
        vscode_1.languages.registerCodeLensProvider({ scheme: "file", language: "scala" }, codeLensRefresher);
        vscode_1.languages.registerCodeLensProvider({ scheme: "jar", language: "scala" }, codeLensRefresher);
        const getTestUI = () => (0, util_1.getValueFromConfig)(config, "testUserInterface", "Test Explorer");
        const istTestManagerDisabled = getTestUI() === "Code Lenses";
        const testManager = (0, testManager_1.createTestManager)(client, istTestManagerDisabled);
        const disableTestExplorer = vscode_1.workspace.onDidChangeConfiguration(() => {
            const testUI = getTestUI();
            if (testUI === "Code Lenses") {
                testManager.disable();
            }
            else {
                testManager.enable();
            }
        });
        context.subscriptions.push(disableTestExplorer);
        context.subscriptions.push(testManager.testController);
        // Handle the metals/executeClientCommand extension notification.
        const executeClientCommandDisposable = client.onNotification(metals_languageclient_1.ExecuteClientCommand.type, (params) => {
            var _a, _b;
            switch (params.command) {
                case metals_languageclient_1.ClientCommands.GotoLocation: {
                    const location = (_a = params.arguments) === null || _a === void 0 ? void 0 : _a[0];
                    vscode_1.commands.executeCommand(`metals.${metals_languageclient_1.ClientCommands.GotoLocation}`, location, metalsFileProvider);
                    break;
                }
                case metals_languageclient_1.ClientCommands.RefreshModel:
                    compilationDoneEmitter.fire();
                    break;
                case metals_languageclient_1.ClientCommands.OpenFolder: {
                    const openWindowParams = (_b = params
                        .arguments) === null || _b === void 0 ? void 0 : _b[0];
                    if (openWindowParams) {
                        vscode_1.commands.executeCommand("vscode.openFolder", vscode_1.Uri.parse(openWindowParams.uri), openWindowParams.openNewWindow);
                    }
                    break;
                }
                case "metals-show-stacktrace": {
                    const html = params.arguments && params.arguments[0];
                    if (typeof html === "string") {
                        const panel = getStacktracePanel();
                        panel.webview.html = html;
                    }
                    break;
                }
                case metals_languageclient_1.ClientCommands.RunDoctor:
                case metals_languageclient_1.ClientCommands.ReloadDoctor:
                    doctorProvider.reloadOrRefreshDoctor(params);
                    break;
                case metals_languageclient_1.ClientCommands.FocusDiagnostics:
                    vscode_1.commands.executeCommand(metals_languageclient_1.ClientCommands.FocusDiagnostics);
                    break;
                case "metals-update-test-explorer": {
                    const updates = params.arguments || [];
                    testManager.updateTestExplorer(updates);
                    break;
                }
                default:
                    outputChannel.appendLine(`unknown command: ${params.command}`);
            }
        });
        context.subscriptions.push(executeClientCommandDisposable);
        // The server updates the client with a brief text message about what
        // it is currently doing, for example "Compiling..".
        const item = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 100);
        item.command = metals_languageclient_1.ClientCommands.ToggleLogs;
        item.hide();
        const metalsStatusDisposable = client.onNotification(metals_languageclient_1.MetalsStatus.type, (params) => {
            item.text = params.text;
            if (params.show) {
                item.show();
            }
            else if (params.hide) {
                item.hide();
            }
            if (params.tooltip) {
                item.tooltip = params.tooltip;
            }
            if (params.command) {
                const command = params.command;
                item.command = params.command;
                vscode_1.commands.getCommands().then((values) => {
                    if (values.includes(command)) {
                        vscode_1.commands.executeCommand(command);
                    }
                });
            }
            else {
                item.command = undefined;
            }
        });
        context.subscriptions.push(metalsStatusDisposable);
        registerTextEditorCommand(`metals.run-current-file`, (editor) => {
            const args = {
                path: editor.document.uri.toString(true),
                runType: metals_languageclient_1.RunType.RunOrTestFile,
            };
            scalaDebugger.start(true, args).then((wasStarted) => {
                if (!wasStarted) {
                    vscode_1.window.showErrorMessage("Debug session not started");
                }
            });
        });
        registerTextEditorCommand(`metals.test-current-target`, (editor) => {
            const args = {
                path: editor.document.uri.toString(true),
                runType: metals_languageclient_1.RunType.TestTarget,
            };
            scalaDebugger.start(true, args).then((wasStarted) => {
                if (!wasStarted) {
                    vscode_1.window.showErrorMessage("Debug session not started");
                }
            });
        });
        registerTextEditorCommand(`metals.${metals_languageclient_1.ServerCommands.GotoSuperMethod}`, (editor) => {
            client.sendRequest(node_1.ExecuteCommandRequest.type, {
                command: metals_languageclient_1.ServerCommands.GotoSuperMethod,
                arguments: [(0, util_1.getTextDocumentPositionParams)(editor)],
            });
        });
        registerTextEditorCommand(`metals.scalafix-run`, (editor) => {
            client.sendRequest(node_1.ExecuteCommandRequest.type, {
                command: "scalafix-run",
                arguments: [(0, util_1.getTextDocumentPositionParams)(editor)],
            });
        });
        registerTextEditorCommand(`metals.${metals_languageclient_1.ServerCommands.SuperMethodHierarchy}`, (editor) => {
            client.sendRequest(node_1.ExecuteCommandRequest.type, {
                command: metals_languageclient_1.ServerCommands.SuperMethodHierarchy,
                arguments: [(0, util_1.getTextDocumentPositionParams)(editor)],
            });
        });
        registerCommand(`metals.${metals_languageclient_1.ServerCommands.AnalyzeStacktrace}`, () => {
            vscode_1.env.clipboard.readText().then((clip) => {
                if (clip.trim().length < 1) {
                    vscode_1.window.showInformationMessage("Clipboard appears to be empty, copy stacktrace to clipboard and retry this command");
                }
                else {
                    client.sendRequest(node_1.ExecuteCommandRequest.type, {
                        command: "analyze-stacktrace",
                        arguments: [clip],
                    });
                }
            });
        });
        registerTextEditorCommand(`metals.${metals_languageclient_1.ServerCommands.CopyWorksheetOutput}`, (editor) => {
            const uri = editor.document.uri;
            if (uri.toString().endsWith("worksheet.sc")) {
                client
                    .sendRequest(node_1.ExecuteCommandRequest.type, {
                    command: metals_languageclient_1.ServerCommands.CopyWorksheetOutput,
                    arguments: [uri.toString()],
                })
                    .then((result) => {
                    vscode_1.window.showInformationMessage(result);
                    if (result.value) {
                        vscode_1.env.clipboard.writeText(result.value);
                        vscode_1.window.showInformationMessage("Copied worksheet evaluation to clipboard.");
                    }
                });
            }
            else {
                vscode_1.window.showWarningMessage("You must be in a worksheet to use this feature.");
            }
        });
        registerCommand(`metals.${metals_languageclient_1.ServerCommands.ResetChoice}`, (args = []) => {
            client.sendRequest(node_1.ExecuteCommandRequest.type, {
                command: metals_languageclient_1.ServerCommands.ResetChoice,
                arguments: args,
            });
        });
        registerCommand(`metals.reset-notifications`, (args = []) => {
            client.sendRequest(node_1.ExecuteCommandRequest.type, {
                command: "reset-notifications",
                arguments: args,
            });
        });
        registerCommand(`metals.${metals_languageclient_1.ServerCommands.Goto}`, (args) => {
            client.sendRequest(node_1.ExecuteCommandRequest.type, {
                command: metals_languageclient_1.ServerCommands.Goto,
                arguments: args,
            });
        });
        registerCommand(`metals.${metals_languageclient_1.ClientCommands.GotoLocation}`, (location) => {
            if (location) {
                (0, goToLocation_1.gotoLocation)(location, metalsFileProvider);
            }
        });
        registerCommand("metals.reveal-active-file", () => {
            if (treeViews) {
                const editor = vscode_1.window.visibleTextEditors.find((e) => isSupportedLanguage(e.document.languageId));
                if (editor) {
                    const params = (0, util_1.getTextDocumentPositionParams)(editor);
                    return vscode_1.window.withProgress({
                        location: vscode_1.ProgressLocation.Window,
                        title: "Metals: Reveal Active File in Side Bar",
                    }, (progress) => {
                        return client
                            .sendRequest(metals_languageclient_1.MetalsTreeViewReveal.type, params)
                            .then((result) => {
                            progress.report({ increment: 100 });
                            if (treeViews) {
                                treeViews.reveal(result);
                            }
                        });
                    });
                }
            }
            else {
                vscode_1.window.showErrorMessage("This version of Metals does not support tree views.");
            }
        });
        registerCommand(metals_languageclient_1.ClientCommands.EchoCommand, (arg) => {
            client.sendRequest(node_1.ExecuteCommandRequest.type, {
                command: arg,
            });
        });
        registerCommand("metals.toggle-implicit-conversions-and-classes", () => {
            toggleBooleanWorkspaceSetting("showImplicitConversionsAndClasses");
        });
        registerCommand("metals.toggle-implicit-parameters", () => {
            toggleBooleanWorkspaceSetting("showImplicitArguments");
        });
        registerCommand("metals.toggle-show-inferred-type", () => {
            toggleBooleanWorkspaceSetting("showInferredType");
        });
        registerCommand(`metals.${metals_languageclient_1.ServerCommands.NewScalaFile}`, (directory) => __awaiter(this, void 0, void 0, function* () {
            return client.sendRequest(node_1.ExecuteCommandRequest.type, {
                command: metals_languageclient_1.ServerCommands.NewScalaFile,
                arguments: [directory === null || directory === void 0 ? void 0 : directory.toString()],
            });
        }));
        registerCommand(`metals.${metals_languageclient_1.ServerCommands.NewJavaFile}`, (directory) => __awaiter(this, void 0, void 0, function* () {
            return client.sendRequest(node_1.ExecuteCommandRequest.type, {
                command: metals_languageclient_1.ServerCommands.NewJavaFile,
                arguments: [directory === null || directory === void 0 ? void 0 : directory.toString()],
            });
        }));
        const findInFilesProvider = (0, findInFiles_1.startFindInFilesProvider)(context);
        const findInFilesView = (0, findInFiles_1.createFindInFilesTreeView)(findInFilesProvider, context);
        registerCommand(`metals.find-text-in-dependency-jars`, () => __awaiter(this, void 0, void 0, function* () {
            return (0, findInFiles_1.executeFindInFiles)(client, findInFilesProvider, findInFilesView, metalsFileProvider, outputChannel);
        }));
        registerCommand(`metals.new-scala-worksheet`, () => __awaiter(this, void 0, void 0, function* () {
            var _c;
            const sendRequest = (args) => {
                return client.sendRequest(node_1.ExecuteCommandRequest.type, {
                    command: metals_languageclient_1.ServerCommands.NewScalaFile,
                    arguments: args,
                });
            };
            const currentUri = (_c = vscode_1.window.activeTextEditor) === null || _c === void 0 ? void 0 : _c.document.uri;
            if (currentUri != null) {
                const parentUri = path.dirname(currentUri.toString());
                const name = path.basename(parentUri);
                const parentPath = vscode_1.Uri.parse(parentUri).fsPath;
                const fullPath = path.join(parentPath, `${name}.worksheet.sc`);
                if (fs.existsSync(fullPath)) {
                    vscode_1.window.showWarningMessage(`A worksheet ${name}.worksheet.sc already exists, opening it instead`);
                    return vscode_1.workspace
                        .openTextDocument(fullPath)
                        .then((textDocument) => vscode_1.window.showTextDocument(textDocument));
                }
                else {
                    return sendRequest([parentUri, name, "scala-worksheet"]);
                }
            }
            else {
                return sendRequest([undefined, undefined, "scala-worksheet"]);
            }
        }));
        registerCommand(`metals.${metals_languageclient_1.ServerCommands.NewScalaProject}`, () => __awaiter(this, void 0, void 0, function* () {
            return client.sendRequest(node_1.ExecuteCommandRequest.type, {
                command: metals_languageclient_1.ServerCommands.NewScalaProject,
            });
        }));
        const workspaceUri = (_b = (_a = vscode_1.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.uri;
        // NOTE: we offer a custom symbol search command to work around the limitations of the built-in one, see https://github.com/microsoft/vscode/issues/98125 for more details.
        registerCommand(`metals.symbol-search`, () => (0, openSymbolSearch_1.openSymbolSearch)(client, metalsFileProvider, workspaceUri));
        vscode_1.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && isSupportedLanguage(editor.document.languageId)) {
                client.sendNotification(metals_languageclient_1.MetalsDidFocus.type, editor.document.uri.toString());
            }
        });
        vscode_1.window.onDidChangeWindowState((windowState) => {
            client.sendNotification(metals_languageclient_1.MetalsWindowStateDidChange.type, {
                focused: windowState.focused,
            });
        });
        client.onRequest(metals_languageclient_1.MetalsInputBox.type, (options, requestToken) => {
            return vscode_1.window
                .showInputBox(options, requestToken)
                .then(metals_languageclient_1.MetalsInputBox.handleInput);
        });
        client.onRequest(metals_languageclient_1.MetalsQuickPick.type, (params, requestToken) => {
            return vscode_1.window
                .showQuickPick(params.items, params, requestToken)
                .then((result) => {
                if (result === undefined) {
                    return { cancelled: true };
                }
                else {
                    return { itemId: result.id };
                }
            });
        });
        vscode_1.languages.registerCompletionItemProvider;
        // Long running tasks such as "import project" trigger start a progress
        // bar with a "cancel" button.
        client.onRequest(metals_languageclient_1.MetalsSlowTask.type, (params, requestToken) => {
            return new Promise((requestResolve) => {
                const showLogs = ` ([show logs](command:${metals_languageclient_1.ClientCommands.ToggleLogs} "Show Metals logs"))`;
                // Wait a bit before showing the progress notification
                const waitTime = 2;
                const delay = Math.max(0, waitTime - (params.secondsElapsed || 0));
                const timeout = setTimeout(() => {
                    vscode_1.window.withProgress({
                        location: vscode_1.ProgressLocation.Notification,
                        title: params.message + showLogs,
                        cancellable: true,
                    }, (progress, progressToken) => {
                        // Update total running time every second.
                        let seconds = params.secondsElapsed || waitTime;
                        progress.report({ message: readableSeconds(seconds) });
                        const interval = setInterval(() => {
                            seconds += 1;
                            progress.report({ message: readableSeconds(seconds) });
                        }, 1000);
                        // Hide logs and clean up resources on completion.
                        function onComplete() {
                            clearInterval(interval);
                        }
                        // Client triggered cancelation from the progress notification.
                        progressToken.onCancellationRequested(() => {
                            onComplete();
                            requestResolve({ cancel: true });
                        });
                        return new Promise((progressResolve) => {
                            // Server completed long running task.
                            requestToken.onCancellationRequested(() => {
                                onComplete();
                                progress.report({ increment: 100 });
                                setTimeout(() => progressResolve(undefined), 1000);
                            });
                        });
                    });
                }, delay * 1000);
                // do not show the notification at all if the task already completed
                requestToken.onCancellationRequested(() => {
                    (0, timers_1.clearTimeout)(timeout);
                });
            });
        });
        // NOTE(olafur): `require("./package.json")` should work in theory but it
        // seems to read a stale version of package.json when I try it.
        const packageJson = JSON.parse(fs.readFileSync(path.join(context.extensionPath, "package.json"), "utf8"));
        const viewIds = packageJson.contributes.views["metals-explorer"].map((view) => view.id);
        treeViews = (0, treeview_1.startTreeView)(client, outputChannel, context, viewIds);
        context.subscriptions.concat(treeViews.disposables);
        scalaDebugger.initialize(outputChannel).forEach((disposable) => {
            context.subscriptions.push(disposable);
        });
        const decorationsRangesDidChangeDispoasable = client.onNotification(decorationProtocol_1.DecorationsRangesDidChange.type, (params) => {
            const editors = vscode_1.window.visibleTextEditors;
            const path = vscode_1.Uri.parse(params.uri).toString();
            const workheetEditors = editors.filter((editor) => editor.document.uri.toString() == path);
            if (workheetEditors.length > 0) {
                const options = params.options.map((o) => {
                    var _a;
                    return {
                        range: new vscode_1.Range(new vscode_1.Position(o.range.start.line, o.range.start.character), new vscode_1.Position(o.range.end.line, o.range.end.character)),
                        hoverMessage: (_a = o.hoverMessage) === null || _a === void 0 ? void 0 : _a.value,
                        renderOptions: o.renderOptions,
                    };
                });
                workheetEditors.forEach((editor) => {
                    if (params.isInline) {
                        editor.setDecorations(inlineDecorationType, options);
                    }
                    else {
                        editor.setDecorations(decorationType, options);
                    }
                });
            }
            else {
                outputChannel.appendLine(`Ignoring decorations for non-active document '${params.uri}'.`);
            }
        });
        context.subscriptions.push(decorationsRangesDidChangeDispoasable);
    }, (reason) => {
        if (reason instanceof Error) {
            outputChannel.appendLine("Could not launch Metals Language Server:");
            outputChannel.appendLine(reason.message);
        }
    });
}
function trackDownloadProgress(title, output, download) {
    const progress = new lazyProgress_1.LazyProgress();
    return (0, metals_languageclient_1.downloadProgress)({
        download,
        onError: (stdout) => stdout.forEach((buffer) => output.append(buffer.toString())),
        onProgress: (msg) => {
            output.appendLine(msg);
            progress.startOrContinue(title, output, download);
        },
    });
}
function readableSeconds(totalSeconds) {
    const minutes = (totalSeconds / 60) | 0;
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
        if (seconds === 0) {
            return `${minutes}m`;
        }
        else {
            return `${minutes}m${seconds}s`;
        }
    }
    else {
        return `${seconds}s`;
    }
}
function enableScaladocIndentation() {
    // Adapted from:
    // https://github.com/Microsoft/vscode/blob/9d611d4dfd5a4a101b5201b8c9e21af97f06e7a7/extensions/typescript/src/typescriptMain.ts#L186
    vscode_1.languages.setLanguageConfiguration("scala", {
        indentationRules: {
            // ^(.*\*/)?\s*\}.*$
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            // ^.*\{[^}"']*$
            increaseIndentPattern: /^.*\{[^}"']*$/,
        },
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
        onEnterRules: [
            {
                // e.g. /** | */
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                afterText: /^\s*\*\/$/,
                action: { indentAction: vscode_1.IndentAction.IndentOutdent, appendText: " * " },
            },
            {
                // indent in places with optional braces
                beforeText: (0, indentPattern_1.increaseIndentPattern)(),
                action: { indentAction: vscode_1.IndentAction.Indent },
            },
            {
                // stop vscode from indenting automatically to last known indentation
                beforeText: /^\s*/,
                /* we still want {} to be nicely split with two new lines into
                 *{
                 *  |
                 *}
                 */
                afterText: /[^\]\}\)]+/,
                action: { indentAction: vscode_1.IndentAction.None },
            },
            {
                // e.g. /** ...|
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                action: { indentAction: vscode_1.IndentAction.None, appendText: " * " },
            },
            {
                // e.g.  * ...| Javadoc style
                beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
                action: { indentAction: vscode_1.IndentAction.None, appendText: "* " },
            },
            {
                // e.g.  * ...| Scaladoc style
                beforeText: /^(\t|(\ \ ))*\*(\ ([^\*]|\*(?!\/))*)?$/,
                action: { indentAction: vscode_1.IndentAction.None, appendText: "* " },
            },
            {
                // e.g.  */|
                beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
                action: { indentAction: vscode_1.IndentAction.None, removeText: 1 },
            },
            {
                // e.g.  *-----*/|
                beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
                action: { indentAction: vscode_1.IndentAction.None, removeText: 1 },
            },
        ],
    });
}
function detectLaunchConfigurationChanges() {
    metalsLanguageClient.detectLaunchConfigurationChanges(vscode_1.workspace, ({ message, reloadWindowChoice, dismissChoice }) => vscode_1.window
        .showInformationMessage(message, reloadWindowChoice, dismissChoice)
        .then((choice) => {
        if (choice === reloadWindowChoice) {
            vscode_1.commands.executeCommand(workbenchCommands.reloadWindow);
        }
    }));
}
function isSupportedLanguage(languageId) {
    switch (languageId) {
        case "scala":
        case "sc":
        case "java":
            return true;
        default:
            return false;
    }
}
// NOTE(gabro): we would normally use the `configurationDefaults` contribution point in the
// extension manifest but that's currently limited to language-scoped settings in VSCode.
// We use this method to set global configuration settings such as `files.watcherExclude`.
function configureSettingsDefaults() {
    function updateFileConfig(configKey, propertyKey, newValues, configurationTarget) {
        const config = vscode_1.workspace.getConfiguration(configKey);
        const configProperty = config.inspect(propertyKey);
        const currentValues = (() => {
            var _a, _b;
            switch (configurationTarget) {
                case vscode_1.ConfigurationTarget.Global:
                    return (_a = configProperty === null || configProperty === void 0 ? void 0 : configProperty.globalValue) !== null && _a !== void 0 ? _a : {};
                case vscode_1.ConfigurationTarget.Workspace:
                    return (_b = configProperty === null || configProperty === void 0 ? void 0 : configProperty.workspaceValue) !== null && _b !== void 0 ? _b : {};
            }
        })();
        config.update(propertyKey, Object.assign(Object.assign({}, currentValues), newValues), configurationTarget);
    }
    updateFileConfig("files", "watcherExclude", {
        "**/.bloop": true,
        "**/.metals": true,
        "**/.ammonite": true,
    }, vscode_1.ConfigurationTarget.Global);
    updateFileConfig("files", "watcherExclude", {
        "**/target": true,
    }, vscode_1.ConfigurationTarget.Workspace);
}
function toggleBooleanWorkspaceSetting(setting) {
    var _a;
    const config = vscode_1.workspace.getConfiguration("metals");
    const configProperty = config.inspect(setting);
    const currentValues = (_a = configProperty === null || configProperty === void 0 ? void 0 : configProperty.workspaceValue) !== null && _a !== void 0 ? _a : false;
    config.update(setting, !currentValues, vscode_1.ConfigurationTarget.Workspace);
}
//# sourceMappingURL=extension.js.map