"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTestItem = void 0;
const util_1 = require("./util");
function removeTestItem(testController, targetName, event) {
    const { fullyQualifiedClassName } = event;
    function removeTestItemLoop(parent, testPrefix) {
        if (testPrefix) {
            const child = parent.children.get(testPrefix.id);
            if (child) {
                removeTestItemLoop(child, testPrefix.next());
                if (child.children.size === 0) {
                    parent.children.delete(child.id);
                }
            }
        }
        else {
            parent.children.delete(fullyQualifiedClassName);
        }
    }
    const buildTargetItem = testController.items.get(targetName);
    if (buildTargetItem) {
        const testPath = (0, util_1.prefixesOf)(event.fullyQualifiedClassName);
        removeTestItemLoop(buildTargetItem, testPath);
        if (buildTargetItem.children.size === 0) {
            testController.items.delete(buildTargetItem.id);
        }
    }
}
exports.removeTestItem = removeTestItem;
//# sourceMappingURL=removeTestItem.js.map