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
exports.createTestManager = void 0;
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
const addTestCases_1 = require("./addTestCases");
const addTestSuites_1 = require("./addTestSuites");
const removeTestItem_1 = require("./removeTestItem");
const testRunHandler_1 = require("./testRunHandler");
const updateTestSuiteLocation_1 = require("./updateTestSuiteLocation");
function createTestManager(client, isDisabled) {
    return new TestManager(client, isDisabled);
}
exports.createTestManager = createTestManager;
class TestManager {
    constructor(client, isDisabled) {
        this.client = client;
        this.testController = vscode_1.tests.createTestController("metalsTestController", "Metals Test Explorer");
        this.isDisabled = false;
        this.isRunning = false;
        if (isDisabled) {
            this.disable();
        }
        const callback = () => (this.isRunning = false);
        this.testController.createRunProfile("Run", vscode_1.TestRunProfileKind.Run, (request, token) => {
            if (!this.isRunning) {
                this.isRunning = true;
                (0, testRunHandler_1.runHandler)(this.testController, true, callback, request, token);
            }
        }, true);
        this.testController.createRunProfile("Debug", vscode_1.TestRunProfileKind.Debug, (request, token) => {
            if (!this.isRunning) {
                this.isRunning = true;
                (0, testRunHandler_1.runHandler)(this.testController, false, callback, request, token);
            }
        }, false);
        this.testController.resolveHandler = (item) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const uri = (_a = item === null || item === void 0 ? void 0 : item.uri) === null || _a === void 0 ? void 0 : _a.toString();
            if (uri) {
                yield this.discoverTestSuites(uri);
            }
        });
    }
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isDisabled = false;
            yield this.discoverTestSuites();
        });
    }
    /**
     * Disables test manager, also it deletes all discovered test items in order to hide gutter icons.
     */
    disable() {
        this.testController.items.forEach((item) => this.testController.items.delete(item.id));
        this.isDisabled = true;
    }
    updateTestExplorer(updates) {
        for (const { targetUri, targetName, events } of updates) {
            for (const event of events) {
                if (event.kind === "removeSuite") {
                    (0, removeTestItem_1.removeTestItem)(this.testController, targetName, event);
                }
                else if (event.kind === "addSuite") {
                    (0, addTestSuites_1.addTestSuite)(this.testController, targetName, targetUri, event);
                }
                else if (event.kind === "updateSuiteLocation") {
                    (0, updateTestSuiteLocation_1.updateTestSuiteLocation)(this.testController, targetName, event);
                }
                else if (event.kind === "addTestCases") {
                    (0, addTestCases_1.addTestCases)(this.testController, targetName, targetUri, event);
                }
            }
        }
    }
    discoverTestSuites(uri) {
        if (this.isDisabled) {
            return Promise.resolve();
        }
        const args = uri ? [{ uri }] : [{}];
        return this.client
            .sendRequest(node_1.ExecuteCommandRequest.type, {
            command: "discover-tests",
            arguments: args,
        })
            .then((updates) => {
            this.updateTestExplorer(updates);
        }, (err) => console.error(err));
    }
}
//# sourceMappingURL=testManager.js.map