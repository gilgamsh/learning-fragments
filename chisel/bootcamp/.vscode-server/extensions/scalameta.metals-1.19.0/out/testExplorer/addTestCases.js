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
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTestCases = void 0;
const vscode = __importStar(require("vscode"));
const util_1 = require("./util");
/**
 * Add test cases to the given test suite.
 *
 * Depending on fully qualified name traverse Test Explorer hierarchy
 * and find suites's test item for which test cases should be added.
 *
 * Assumes that path from root to the leaf exists.
 */
function addTestCases(testController, targetName, targetUri, event) {
    function addTestCasesLoop(parent, testPrefix) {
        if (testPrefix) {
            const child = parent.children.get(testPrefix.id);
            if (child) {
                addTestCasesLoop(child, testPrefix.next());
            }
            else {
                console.error("Cannot find test item for " + event.fullyQualifiedClassName);
            }
        }
        else {
            parent.children.replace([]);
            for (const { location, name } of event.testCases) {
                const parsedUri = vscode.Uri.parse(location.uri);
                const parsedRange = (0, util_1.toVscodeRange)(location.range);
                const id = `${parent.id}.${name}`;
                const testItem = testController.createTestItem(id, name, parsedUri);
                (0, util_1.refineTestItem)("testcase", testItem, targetUri, targetName, parent);
                testItem.range = parsedRange;
                parent.children.add(testItem);
            }
        }
    }
    const buildTargetItem = testController.items.get(targetName);
    if (buildTargetItem) {
        const testPath = (0, util_1.prefixesOf)(event.fullyQualifiedClassName, true);
        addTestCasesLoop(buildTargetItem, testPath);
    }
}
exports.addTestCases = addTestCases;
//# sourceMappingURL=addTestCases.js.map