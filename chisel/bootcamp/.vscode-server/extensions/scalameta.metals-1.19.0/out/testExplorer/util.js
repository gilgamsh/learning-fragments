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
exports.prefixesOf = exports.gatherTestItems = exports.toVscodeRange = exports.refineTestItem = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Refine vscode.TestItem by extending it with additional metadata needed for test runs.
 * In order to handle all 4 cases with minimal boilerplate and casting reduced to the minimum as this function is overloaded
 * for all 4 cases. Thanks to the overloading we can achieve mediocre type safety:
 * - project kind doesn't need parent
 * - return types are narrowed down
 * while, at the same time, we are doing casting.
 */
function refineTestItem(kind, test, targetUri, targetName, parent) {
    const cast = test;
    cast._metalsKind = kind;
    cast._metalsTargetName = targetName;
    cast._metalsTargetUri = targetUri;
    if (kind !== "project") {
        cast._metalsParent = parent;
    }
    return cast;
}
exports.refineTestItem = refineTestItem;
function toVscodeRange(range) {
    return new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);
}
exports.toVscodeRange = toVscodeRange;
function gatherTestItems(testCollection) {
    const tests = [];
    testCollection.forEach((test) => tests.push(test));
    return tests;
}
exports.gatherTestItems = gatherTestItems;
/**
 * Generate prefixes of fully qualified name for test items
 * includeSelf = false :
 * 'a.b.c.d.TestSuite' -> ['a', 'a.b', 'a.b.c', 'a.b.c.d']
 * includeSelf = true :
 * 'a.b.c.d.TestSuite' -> ['a', 'a.b', 'a.b.c', 'a.b.c.d', 'a.b.c.d.TestSuite']
 */
function prefixesOf(fullyQualifiedName, includeSelf = false) {
    const partitioned = fullyQualifiedName.split(".");
    const parts = includeSelf
        ? partitioned
        : partitioned.slice(0, partitioned.length - 1);
    const prefixes = [];
    for (const part of parts) {
        const lastOpt = prefixes[prefixes.length - 1];
        const prefix = lastOpt ? `${lastOpt}.${part}` : part;
        prefixes.push(prefix);
    }
    function makeTestPrefix(idx, parts, prefixes) {
        if (prefixes[idx] != null) {
            return {
                id: prefixes[idx],
                label: parts[idx],
                next: () => makeTestPrefix(idx + 1, parts, prefixes),
            };
        }
        else {
            return null;
        }
    }
    return makeTestPrefix(0, parts, prefixes);
}
exports.prefixesOf = prefixesOf;
//# sourceMappingURL=util.js.map