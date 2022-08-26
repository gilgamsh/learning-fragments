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
exports.runHandler = exports.testRunnerId = void 0;
const metals_languageclient_1 = require("metals-languageclient");
const vscode = __importStar(require("vscode"));
const scalaDebugger_1 = require("../scalaDebugger");
const analyzeTestRun_1 = require("./analyzeTestRun");
const util_1 = require("./util");
// this id is used to mark DAP sessions created by TestController
// thanks to that debug tracker knows which requests it should track and gather results
exports.testRunnerId = "scala-dap-test-runner";
/**
 * Stores results from executed test suites.
 */
const suiteResults = new Map();
/**
 * Register tracker which tracks all DAP sessions which are started with @constant {testRunnerId} kind.
 * Dap sends execution result for every suite included in TestRun in a special event of kind 'testResult'.
 * Tracker has to capture these events and store them all in map under debug session id as a key.
 */
vscode.debug.registerDebugAdapterTrackerFactory("scala", {
    createDebugAdapterTracker(session) {
        if (session.configuration.kind === exports.testRunnerId) {
            return {
                onWillStartSession: () => suiteResults.set(session.id, []),
                onDidSendMessage: (msg) => {
                    var _a;
                    if (msg.event === "testResult" &&
                        msg.body.category === "testResult") {
                        (_a = suiteResults.get(session.id)) === null || _a === void 0 ? void 0 : _a.push(msg.body.data);
                    }
                },
            };
        }
    },
});
/**
 * runHandler is a function which is called to start a TestRun.
 * Depending on the run profile it may be ordinary run or a debug TestRun.
 * It creates run queue which contains test supposed to be run and then,
 * for each entry it creates & run a debug session.
 */
function runHandler(testController, noDebug, afterFinished, request, token) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const run = testController.createTestRun(request);
        const includes = new Set((_a = request.include) !== null && _a !== void 0 ? _a : []);
        const excludes = new Set((_b = request.exclude) !== null && _b !== void 0 ? _b : []);
        const queue = [];
        /**
         * Loop through all included tests in request and add them to our queue if they are not excluded explicitly
         */
        function createRunQueue(tests) {
            for (const test of tests) {
                if (!excludes.has(test)) {
                    const kind = test._metalsKind;
                    if (kind === "project" || kind === "package") {
                        createRunQueue((0, util_1.gatherTestItems)(test.children));
                    }
                    else if (kind === "suite") {
                        run.started(test);
                        queue.push(test);
                        (0, util_1.gatherTestItems)(test.children).forEach((t) => run.started(t));
                    }
                    else if (kind === "testcase") {
                        runParent(test);
                        queue.push(test);
                    }
                }
            }
        }
        function runParent(test) {
            if (test) {
                runParent(test.parent);
                run.started(test);
            }
        }
        createRunQueue(includes);
        const testSuiteSelection = queue.map((test) => {
            const kind = test._metalsKind;
            if (kind === "suite") {
                return {
                    className: test.id,
                    tests: [],
                };
            }
            else {
                return {
                    className: test._metalsParent.id,
                    tests: [test.label],
                };
            }
        });
        try {
            if (!token.isCancellationRequested && queue.length > 0) {
                const targetUri = queue[0]._metalsTargetUri;
                yield runDebugSession(run, noDebug, targetUri, testSuiteSelection, queue);
            }
        }
        finally {
            run.end();
            afterFinished();
        }
    });
}
exports.runHandler = runHandler;
/**
 * @param noDebug determines if debug session will be started as a debug or normal run
 */
function runDebugSession(run, noDebug, targetUri, testSuiteSelection, tests) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield createDebugSession(targetUri, testSuiteSelection);
        if (!session) {
            return;
        }
        const wasStarted = yield startDebugging(session, noDebug);
        if (!wasStarted) {
            vscode.window.showErrorMessage("Debug session not started");
            return;
        }
        yield analyzeResults(run, tests);
    });
}
/**
 * Creates a debug session via Metals DebugAdapterStart command.
 * dataKind and data are determined by BSP debug request method.
 */
function createDebugSession(targetUri, suites) {
    return __awaiter(this, void 0, void 0, function* () {
        const debugSessionParams = {
            target: { uri: targetUri },
            requestData: {
                suites,
                jvmOptions: [],
                environmentVariables: [],
            },
        };
        return vscode.commands.executeCommand(metals_languageclient_1.ServerCommands.DebugAdapterStart, debugSessionParams);
    });
}
/**
 * Starts interacting with created debug session.
 * kind is set to the testRunnerId. It helps to differentiate debug session which were started by Test Explorer.
 * These sessions are tracked by a vscode.debug.registerDebugAdapterTrackerFactory, which capture special event
 * containing information about test suite execution.
 */
function startDebugging(session, noDebug) {
    return __awaiter(this, void 0, void 0, function* () {
        const port = (0, scalaDebugger_1.debugServerFromUri)(session.uri).port;
        const configuration = {
            type: "scala",
            name: session.name,
            noDebug,
            request: "launch",
            debugServer: port,
            kind: exports.testRunnerId,
        };
        return vscode.debug.startDebugging(undefined, configuration);
    });
}
/**
 * Analyze test results when debug session ends.
 * Retrieves test suite results for current debus session gathered by DAP tracker and passes
 * them to the analyzer function. After analysis ends, results are cleaned.
 */
function analyzeResults(run, tests) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            const disposable = vscode.debug.onDidTerminateDebugSession((session) => {
                var _a;
                const testSuitesResult = (_a = suiteResults.get(session.id)) !== null && _a !== void 0 ? _a : [];
                // disposes current subscription and removes data from result map
                const teardown = () => {
                    disposable.dispose();
                    suiteResults.delete(session.id);
                };
                // analyze current TestRun
                (0, analyzeTestRun_1.analyzeTestRun)(run, tests, testSuitesResult, teardown);
                run.end();
                return resolve();
            });
        });
    });
}
//# sourceMappingURL=testRunHandler.js.map