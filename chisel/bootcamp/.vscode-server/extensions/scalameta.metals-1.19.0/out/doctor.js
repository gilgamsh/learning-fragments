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
exports.DoctorProvider = void 0;
const metals_languageclient_1 = require("metals-languageclient");
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
const doctorEndpoint = "metals/doctorVisibilityDidChange";
const doctorNotification = new node_1.NotificationType(doctorEndpoint);
class DoctorProvider {
    constructor(client) {
        this.client = client;
        /**
         * Although in protocol there is `visible`, currently in vscode, we are cheating a little bit.
         * We treat doctor to be visible if webview is opened, no matter if it is focused or not.
         * We should take focus into account when doctor caching mechanism will be implemented on the server.
         */
        this.isOpened = false;
    }
    dispose() {
        var _a;
        (_a = this.doctor) === null || _a === void 0 ? void 0 : _a.dispose();
    }
    getDoctorPanel(isReload) {
        if (!this.doctor) {
            this.doctor = vscode_1.window.createWebviewPanel("metals-doctor", "Metals Doctor", vscode_1.ViewColumn.Active, { enableCommandUris: true });
            this.isOpened = true;
            this.doctor.onDidDispose(() => {
                this.client.sendNotification(doctorNotification, { visible: false });
                this.isOpened = false;
                this.doctor = undefined;
            });
        }
        else if (!isReload) {
            this.doctor.reveal();
        }
        return this.doctor;
    }
    reloadOrRefreshDoctor(params) {
        const isRun = params.command === metals_languageclient_1.ClientCommands.RunDoctor;
        const isReload = params.command === metals_languageclient_1.ClientCommands.ReloadDoctor;
        if (isRun || (this.doctor && isReload)) {
            const html = params.arguments && params.arguments[0];
            if (typeof html === "string") {
                const panel = this.getDoctorPanel(isReload);
                panel.webview.html = html;
            }
        }
    }
    runDoctor() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.sendRequest(node_1.ExecuteCommandRequest.type, {
                command: metals_languageclient_1.ServerCommands.DoctorRun,
            });
            this.isOpened = true;
        });
    }
}
exports.DoctorProvider = DoctorProvider;
//# sourceMappingURL=doctor.js.map