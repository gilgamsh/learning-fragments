
var 护眼主题插件 = require('./vscode护眼主题和gitee工具')

function activate(context) {
    护眼主题插件.运行插件(context)
}

function deactivate(context){
    护眼主题插件.退出插件(context)
}
exports.activate = activate
exports.deactivate = deactivate