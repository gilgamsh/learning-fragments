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
exports.showInstallJavaAction = exports.showMissingJavaAction = void 0;
const metals_languageclient_1 = require("metals-languageclient");
const vscode_1 = require("vscode");
const consts_1 = require("./consts");
const workbenchCommands = __importStar(require("./workbenchCommands"));
function showMissingJavaAction(outputChannel) {
    const message = "Unable to find a Java 11 or Java 17 installation on this computer. " +
        "To fix this problem, update the 'metals.javaHome' setting to point to a Java 11 or Java 17 home directory " +
        "or select a version to install automatically";
    outputChannel.appendLine(message);
    return vscode_1.window
        .showErrorMessage(message, consts_1.openSettingsAction, consts_1.installJava11Action, consts_1.installJava17Action)
        .then((choice) => chooseJavaToInstall(choice, outputChannel));
}
exports.showMissingJavaAction = showMissingJavaAction;
function showInstallJavaAction(outputChannel) {
    const message = "Which version would you like to install?" +
        "Currently supported are JDK 11 or JDK 17: ";
    outputChannel.appendLine(message);
    return vscode_1.window
        .showInformationMessage(message, {
        modal: true,
    }, consts_1.openSettingsAction, consts_1.installJava11Action, consts_1.installJava17Action)
        .then((choice) => chooseJavaToInstall(choice, outputChannel));
}
exports.showInstallJavaAction = showInstallJavaAction;
function chooseJavaToInstall(choice, outputChannel) {
    switch (choice) {
        case consts_1.openSettingsAction: {
            vscode_1.commands.executeCommand(workbenchCommands.openSettings);
            break;
        }
        case consts_1.installJava11Action: {
            vscode_1.window.withProgress({
                location: vscode_1.ProgressLocation.Notification,
                title: `Installing Java (JDK 11), please wait...`,
                cancellable: true,
            }, () => (0, metals_languageclient_1.installJava)({ javaVersion: "adopt@1.11", outputChannel }).then(updateJavaConfig));
            break;
        }
        case consts_1.installJava17Action: {
            vscode_1.window.withProgress({
                location: vscode_1.ProgressLocation.Notification,
                title: `Installing Java (JDK 17), please wait...`,
                cancellable: true,
            }, () => (0, metals_languageclient_1.installJava)({ javaVersion: "openjdk@1.17", outputChannel }).then(updateJavaConfig));
            break;
        }
    }
}
function updateJavaConfig(javaHome) {
    const config = vscode_1.workspace.getConfiguration("metals");
    const configProperty = config.inspect("javaHome");
    if ((configProperty === null || configProperty === void 0 ? void 0 : configProperty.workspaceValue) != undefined) {
        config.update("javaHome", javaHome, false);
    }
    else {
        config.update("javaHome", javaHome, true);
    }
}
//# sourceMappingURL=installJavaAction.js.map