"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyProgress = void 0;
const vscode_1 = require("vscode");
/**
 * A progress bar that starts only the first time `startOrContinue` is called.
 */
class LazyProgress {
    startOrContinue(title, output, download) {
        if (!this.progress) {
            this.progress = vscode_1.window.withProgress({ location: vscode_1.ProgressLocation.Notification, title: title }, (p) => new Promise((resolve) => {
                output.show();
                function complete() {
                    p.report({ increment: 100 });
                    setTimeout(() => {
                        resolve();
                    }, 2000);
                }
                download
                    .then(() => {
                    /// Hide the output channel on success but keep it open on error.
                    output.hide();
                })
                    .then(complete, complete);
            }));
        }
    }
}
exports.LazyProgress = LazyProgress;
//# sourceMappingURL=lazyProgress.js.map