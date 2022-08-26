"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTestRun = void 0;
const ansicolor_1 = require("ansicolor");
const util_1 = require("./util");
/**
 * Analyze results from TestRun and pass inform Test Controller about them.
 *
 * @param run Interface which corresponds to available actions in vscode.TestRun
 * @param targetName target name for which TestRun was created
 * @param testSuites which should have been run in this TestRun
 * @param testSuitesResult result which came back from DAP server
 * @param teardown cleanup logic which has to be called at the end of function
 */
function analyzeTestRun(run, tests, testSuitesResults, teardown) {
    var _a;
    const results = createResultsMap(testSuitesResults);
    for (const test of tests) {
        const kind = test._metalsKind;
        const suiteName = kind === "suite"
            ? test.id
            : test._metalsParent.id;
        const result = results.get(suiteName);
        if (result != null) {
            // if suite run contains test cases (run was started for (single) test case)
            if (kind === "testcase") {
                analyzeTestCases(run, result, [test]);
            }
            // if test suite has children (test cases) do a more fine-grained analyze of results.
            // run was started for whole suite which has children (e.g. junit one)
            else if (test.children.size > 0) {
                const items = (0, util_1.gatherTestItems)(test.children);
                analyzeTestCases(run, result, items, test);
            }
            else {
                analyzeTestSuite(run, result, test);
            }
        }
        else {
            (_a = run.skipped) === null || _a === void 0 ? void 0 : _a.call(run, test);
        }
    }
    teardown === null || teardown === void 0 ? void 0 : teardown();
}
exports.analyzeTestRun = analyzeTestRun;
/**
 * Transforms array of suite results into mapping between suite name and suite result.
 */
function createResultsMap(testSuitesResults) {
    const resultsTuples = testSuitesResults.map((result) => [result.suiteName, result]);
    const results = new Map(resultsTuples);
    return results;
}
/**
 * Analyze result of each test case from the test suite independently.
 */
function analyzeTestCases(run, result, testCases, parent) {
    var _a;
    const testCasesResults = createTestCasesMap(result);
    testCases.forEach((test) => {
        var _a, _b, _c;
        const name = test.id;
        const testCaseResult = testCasesResults.get(name);
        if ((testCaseResult === null || testCaseResult === void 0 ? void 0 : testCaseResult.kind) === "passed") {
            (_a = run.passed) === null || _a === void 0 ? void 0 : _a.call(run, test, testCaseResult.duration);
        }
        else if ((testCaseResult === null || testCaseResult === void 0 ? void 0 : testCaseResult.kind) === "failed") {
            const errorMsg = toTestMessage(testCaseResult.error);
            (_b = run.failed) === null || _b === void 0 ? void 0 : _b.call(run, test, errorMsg, testCaseResult.duration);
        }
        else {
            (_c = run.skipped) === null || _c === void 0 ? void 0 : _c.call(run, test);
        }
    });
    if (parent) {
        const tests = new Set(testCases.map((t) => t.id));
        const failed = Array.from(testCasesResults.values())
            .filter((result) => !tests.has(result.testName))
            .filter(isFailed);
        if (failed.length > 0) {
            const msg = extractErrorMessages(failed);
            (_a = run.failed) === null || _a === void 0 ? void 0 : _a.call(run, parent, msg, result.duration);
        }
    }
}
/**
 * Transforms suite result into mapping between test case name and its result.
 */
function createTestCasesMap(testSuiteResult) {
    const tuples = testSuiteResult.tests.map((test) => [test.testName, test]);
    const testCasesResult = new Map(tuples);
    return testCasesResult;
}
/**
 * Analyze suite result treating test cases as whole, one entity.
 * If one of them fails, the whole suite fails.
 */
function analyzeTestSuite(run, result, testSuite) {
    var _a, _b;
    const failed = result.tests.filter(isFailed);
    if (failed.length > 0) {
        const msg = extractErrorMessages(failed);
        (_a = run.failed) === null || _a === void 0 ? void 0 : _a.call(run, testSuite, msg, result.duration);
    }
    else {
        (_b = run.passed) === null || _b === void 0 ? void 0 : _b.call(run, testSuite, result.duration);
    }
}
function isFailed(result) {
    return result.kind === "failed";
}
/**
 * Extract error messages for array of failed tests and map them to the TestMessage.
 * Messages can include ANSI escape sequences such as colors, but they have to be stripped
 * because vscode test explorer doesn't support ANSI color codes.
 */
function extractErrorMessages(failed) {
    const messages = failed.map((entry) => toTestMessage(entry.error));
    return messages;
}
function toTestMessage(error) {
    return { message: ansicolor_1.ansicolor.strip(error) };
}
//# sourceMappingURL=analyzeTestRun.js.map