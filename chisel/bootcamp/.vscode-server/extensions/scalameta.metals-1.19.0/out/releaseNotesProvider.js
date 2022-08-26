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
exports.showReleaseNotes = void 0;
const vscode_1 = require("vscode");
const vscode = __importStar(require("vscode"));
const semver = __importStar(require("semver"));
const remarkable_1 = require("remarkable");
const util_1 = require("./util");
const types_1 = require("./types");
const versionKey = "metals-server-version";
/**
 * Show release notes if possible, swallow errors since its not a crucial feature.
 * Treats snapshot versions like 0.11.6+67-926ec9a3-SNAPSHOT as a 0.11.6.
 *
 * @param calledOn determines when this function was called.
 * For 'onExtensionStart' case show release notes only once (first time).
 * For 'onUserDemand' show extension notes no matter if it's another time.
 */
function showReleaseNotes(calledOn, context, serverVersion, outputChannel) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield showReleaseNotesImpl(calledOn, context, serverVersion);
            if (result.kind === "left") {
                const msg = `Release notes was not shown: ${result.value}`;
                outputChannel.appendLine(msg);
            }
        }
        catch (error) {
            outputChannel.appendLine(`Error, couldn't show release notes for Metals ${serverVersion}`);
            outputChannel.appendLine(`${error}`);
        }
    });
}
exports.showReleaseNotes = showReleaseNotes;
function showReleaseNotesImpl(calledOn, context, currentVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.globalState;
        const version = getVersion();
        if (version.kind === "left") {
            return version;
        }
        const remote = isRemote();
        if (calledOn === "onExtensionStart" && remote.kind === "left") {
            return remote;
        }
        const releaseNotesUrl = yield getMarkdownLink(version.value);
        if (releaseNotesUrl.kind === "left") {
            return releaseNotesUrl;
        }
        // actual logic starts here
        yield showPanel(version.value, releaseNotesUrl.value);
        return (0, types_1.makeRight)(undefined);
        // below are helper functions
        function showPanel(version, releaseNotesUrl) {
            return __awaiter(this, void 0, void 0, function* () {
                const panel = vscode.window.createWebviewPanel(`scalameta.metals.whatsNew`, `Metals ${version} release notes`, vscode.ViewColumn.One);
                const releaseNotes = yield getReleaseNotesMarkdown(releaseNotesUrl, context, (uri) => panel.webview.asWebviewUri(uri));
                panel.webview.html = releaseNotes;
                panel.reveal();
                // Update current device's latest server version when there's no value or it was a older one.
                // Then sync this value across other devices.
                state.update(versionKey, version);
                state.setKeysForSync([versionKey]);
                context.subscriptions.push(panel);
            });
        }
        /**
         * Show panel:
         * - for wsl
         * - when it's not a remote env
         */
        function isRemote() {
            return vscode_1.env.remoteName == null || vscode_1.env.remoteName === "wsl"
                ? (0, types_1.makeRight)(undefined)
                : (0, types_1.makeLeft)(`is a remote environment ${vscode_1.env.remoteName}`);
        }
        /**
         *  Return version for which release notes should be displayed
         */
        function getVersion() {
            const previousVersion = state.get(versionKey);
            // strip version to
            // in theory semver.clean can return null, but we're almost sure that currentVersion is well defined
            const cleanVersion = semver.clean(currentVersion);
            if (cleanVersion == null) {
                const msg = `can't transform ${currentVersion} to 'major.minor.patch'`;
                return (0, types_1.makeLeft)(msg);
            }
            // if there was no previous version or user explicitly wants to read release notes
            // show release notes for current cleaned version
            if (!previousVersion || calledOn === "onUserDemand") {
                return (0, types_1.makeRight)(cleanVersion);
            }
            const compare = semver.compare(cleanVersion, previousVersion);
            const diff = semver.diff(cleanVersion, previousVersion);
            // take into account only major, minor and patch, ignore snapshot releases
            const isNewerVersion = compare === 1 &&
                (diff === "major" || diff === "minor" || diff === "patch");
            return isNewerVersion
                ? (0, types_1.makeRight)(cleanVersion)
                : (0, types_1.makeLeft)(`not showing release notes since they've already been seen for your current version`);
        }
    });
}
/**
 * Translate server version to link to the markdown file with release notes.
 * @param version clean version in major.minor.patch form
 * If version has release notes return link to them, if not return nothing.
 * Sample link to which we're doing request https://api.github.com/repos/scalameta/metals/releases/tags/v0.11.6.
 * From such JSON obtain body property which contains link to the blogpost, but what's more important,
 * contains can be converted to name of markdown file with release notes.
 */
function getMarkdownLink(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const releaseInfoUrl = `https://api.github.com/repos/scalameta/metals/releases/tags/v${version}`;
        const options = {
            headers: {
                "User-Agent": "metals",
            },
        };
        const stringifiedContent = yield (0, util_1.fetchFrom)(releaseInfoUrl, options);
        const body = JSON.parse(stringifiedContent)["body"];
        if (!body) {
            const msg = `can't obtain content of ${releaseInfoUrl}`;
            return (0, types_1.makeLeft)(msg);
        }
        // matches (2022)/(06)/(03)/(aluminium) via capture groups
        const matchResult = body.match(new RegExp("(\\d\\d\\d\\d)/(\\d\\d)/(\\d\\d)/(\\w+)"));
        // whole expression + 4 capture groups = 5 entries
        if ((matchResult === null || matchResult === void 0 ? void 0 : matchResult.length) === 5) {
            // omit first entry
            const [_, ...tail] = matchResult;
            const name = tail.join("-");
            const url = `https://raw.githubusercontent.com/scalameta/metals/main/website/blog/${name}.md`;
            return (0, types_1.makeRight)(url);
        }
        else {
            const msg = `can't obtain markdown file name for ${version} from ${body}`;
            return (0, types_1.makeLeft)(msg);
        }
    });
}
/**
 *
 * @param releaseNotesUrl Url which server markdown with release notes
 * @param context Extension context
 * @param asWebviewUri
 * Webviews cannot directly load resources from the workspace or local
 * file system using file: uris. The asWebviewUri function takes a local
 * file: uri and converts it into a uri that can be used inside of a webview
 * to load the same resource.
 * proxy to webview.asWebviewUri
 */
function getReleaseNotesMarkdown(releaseNotesUrl, context, asWebviewUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const text = yield (0, util_1.fetchFrom)(releaseNotesUrl);
        // every release notes starts with that
        const beginning = "We're happy to announce the release of";
        const notesStartIdx = text.indexOf(beginning);
        const releaseNotes = text.substring(notesStartIdx);
        // cut metadata yaml from release notes, it start with --- and ends with ---
        const metadata = text
            .substring(0, notesStartIdx - 1)
            .replace("---", "")
            .replace("---", "")
            .trim()
            .split("\n");
        const author = metadata[0].slice("author: ".length);
        const title = metadata[1].slice("title: ".length);
        const authorUrl = metadata[2].slice("authorURL: ".length);
        const md = new remarkable_1.Remarkable({ html: true });
        const renderedNotes = md.render(releaseNotes);
        // Uri with additional styles for webview
        const stylesPathMainPath = vscode.Uri.joinPath(context.extensionUri, "media", "styles.css");
        // need to transform Uri
        const stylesUri = asWebviewUri(stylesPathMainPath);
        return `
  <!DOCTYPE html>
  <html lang="en" style="height: 100%; width: 100%;">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${stylesUri}" rel="stylesheet">
  </head>
  <body>
    <h1>${title}</h1>
    <hr>
    <p>
      Showing Metals' release notes embedded in VS Code is an experimental feature, in case of any issues report them at 
      <a href="https://github.com/scalameta/metals-vscode">https://github.com/scalameta/metals-vscode</a>.
      <br/>
      <br/>
      Original blogpost can be viewed at 
      <a href="https://scalameta.org/metals/blog/" target="_blank" itemprop="url">
      <span itemprop="name">Metals blog</span>
      </a>.
    </p>
    <hr>
    <p>
      <a href="${authorUrl}" target="_blank" itemprop="url">
        <span itemprop="name">${author}</span>
      </a>
    </p>
    <hr>
    ${renderedNotes}
    </body>
  </html>
`;
    });
}
//# sourceMappingURL=releaseNotesProvider.js.map