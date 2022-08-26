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
exports.addTestSuite = void 0;
const vscode = __importStar(require("vscode"));
const util_1 = require("./util");
/**
 * Add test suite to the Test Explorer.
 *
 * Depending on fully qualified name traverse Test Explorer hierarchy,
 * creating intermediate test items if necessary, and find test item for which
 * a newly created test suite item should be added.
 *
 * If test item already exists do nothing
 */
function addTestSuite(testController, targetName, targetUri, event) {
    const buildTargetItem = getOrCreateBuildTargetItem(testController, targetName, targetUri);
    function addTestSuiteLoop(parent, testPrefix) {
        if (testPrefix) {
            const child = parent.children.get(testPrefix.id);
            if (child) {
                addTestSuiteLoop(child, testPrefix.next());
            }
            else {
                const { id, label } = testPrefix;
                const packageNode = testController.createTestItem(id, label);
                (0, util_1.refineTestItem)("package", packageNode, targetUri, targetName, parent);
                parent.children.add(packageNode);
                addTestSuiteLoop(packageNode, testPrefix.next());
            }
        }
        else {
            const { className, location, fullyQualifiedClassName } = event;
            const parsedUri = vscode.Uri.parse(location.uri);
            const parsedRange = (0, util_1.toVscodeRange)(location.range);
            const testItem = testController.createTestItem(fullyQualifiedClassName, className, parsedUri);
            (0, util_1.refineTestItem)("suite", testItem, targetUri, targetName, parent);
            // if canResolveChildren is true then test item is shown as expandable in the Test Explorer view
            testItem.canResolveChildren = event.canResolveChildren;
            testItem.range = parsedRange;
            parent.children.add(testItem);
        }
    }
    const testPath = (0, util_1.prefixesOf)(event.fullyQualifiedClassName);
    addTestSuiteLoop(buildTargetItem, testPath);
}
exports.addTestSuite = addTestSuite;
/**
 * Create and add test item for a build target (first request)
 * or get already created (subsequent requests)
 */
function getOrCreateBuildTargetItem(testController, targetName, targetUri) {
    const buildTarget = testController.items.get(targetName);
    if (buildTarget) {
        return buildTarget;
    }
    const createdNode = testController.createTestItem(targetName, targetName);
    (0, util_1.refineTestItem)("project", createdNode, targetUri, targetName);
    testController.items.add(createdNode);
    return createdNode;
}
//# sourceMappingURL=addTestSuites.js.map