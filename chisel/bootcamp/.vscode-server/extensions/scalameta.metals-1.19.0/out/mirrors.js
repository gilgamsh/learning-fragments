"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoursierMirrorPath = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("./util");
const mirrorProperty = "coursierMirror";
/**
 * @returns path to the mirror config file described in https://get-coursier.io/blog/#mirrors
 */
function getCoursierMirrorPath(config) {
    const mirrorConfig = (0, util_1.getConfigValue)(config, mirrorProperty);
    const value = mirrorConfig === null || mirrorConfig === void 0 ? void 0 : mirrorConfig.value.trim();
    if (mirrorConfig && value && value.length > 0) {
        return writeMirrorFile(value, mirrorConfig.target);
    }
}
exports.getCoursierMirrorPath = getCoursierMirrorPath;
function writeMirrorFile(mirrorString, target) {
    const dotMetalsDir = (0, util_1.metalsDir)(target);
    if (!fs_1.default.existsSync(dotMetalsDir)) {
        fs_1.default.mkdirSync(dotMetalsDir);
    }
    const file = path_1.default.join(dotMetalsDir, "mirror.properties");
    const mirrorContents = [
        "metals.from=https://repo1.maven.org/maven2",
        `metals.to=${mirrorString}`,
    ].join("\n");
    fs_1.default.writeFileSync(file, mirrorContents);
    return file;
}
//# sourceMappingURL=mirrors.js.map