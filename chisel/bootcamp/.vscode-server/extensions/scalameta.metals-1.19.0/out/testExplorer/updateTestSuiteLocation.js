"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTestSuiteLocation = void 0;
const util_1 = require("./util");
/**
 *
 * Depending on fully qualified name traverse Test Explorer hierarchy
 * and find suites for which range should be updated.
 *
 * Assumes that path from root to the leaf exists.
 */
function updateTestSuiteLocation(testController, targetName, event) {
    function updateTestSuiteLocationLoop(parent, testPrefix) {
        if (testPrefix) {
            const child = parent.children.get(testPrefix.id);
            if (child) {
                updateTestSuiteLocationLoop(child, testPrefix.next());
            }
            else {
                console.error("Cannot find test item for " + event.fullyQualifiedClassName);
            }
        }
        else {
            const parsedRange = (0, util_1.toVscodeRange)(event.location.range);
            parent.range = parsedRange;
        }
    }
    const buildTargetItem = testController.items.get(targetName);
    if (buildTargetItem) {
        const testPath = (0, util_1.prefixesOf)(event.fullyQualifiedClassName, true);
        updateTestSuiteLocationLoop(buildTargetItem, testPath);
    }
}
exports.updateTestSuiteLocation = updateTestSuiteLocation;
//# sourceMappingURL=updateTestSuiteLocation.js.map