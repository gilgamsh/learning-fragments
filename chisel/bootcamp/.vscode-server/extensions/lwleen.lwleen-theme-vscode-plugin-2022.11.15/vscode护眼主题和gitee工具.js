/*
===================== 笔记 =============================
  var 函数 = (参数) =>{}   //这是个函数
  var 对象 ={ 成员: 属性或函数方法 , 成员: 属性或函数方法 }   //这是个对象
  var 数组 =[ 成员, 成员 ]
  .then 执行完后面接 .then 才会顺序执行   与.then()外面的同步执行
  {} 里面返回数据必须 return   省略{}时才能不带
  
  声明风格及最佳实践：先使用const,let次之，不使用var。
  const的行为和let基本相同，唯一的区别是const它声明变量时必须同时初始化变量，且尝试修改const声明的变量会导致运行时错误（TypeError）。
  使用const定义的变量保存的是一个地址值，这个地址指向一个对象引用。const保证这个地址值是不可变的，但对象本身是可变的，所以可以变更这个对象内部的属性。


  vscode 折叠快捷键    ctrl + k  ctrl +  123456  选择括号级别折叠
*/
module.exports.运行插件 = 运行插件     //模块接口，声明这个模块对外暴露什么内容
module.exports.退出插件 = 退出插件
 
 

const vscode = require('vscode')                 // vscode  API 接口
const path = require('path')                     // 路径拼接
const fs = require('fs')                         // 文件操作
const os = require('os')                         // 可获得系统信息 
const child_process = require('child_process')   // 子程序执行 shell 指令

const { workerData } = require('worker_threads')
const { DefaultDeserializer } = require('v8')
const { stdout, stderr, config } = require('process')
const { ifError } = require('assert')

const https = require('https')
const http = require('http')
const url = require('url');
const { basename } = require('path')
//const { join } = require('path')

//======= 第三方 nodejs 模块
//const mime = require('mime');//用于处理文件的Content-Type，通过npm安装
//const 克隆仓库 = require('git-clone')
//const 网络通讯 = require('axios')   
//const 正则库 = require('vscode-oniguruma')  //一个现代且灵活的正则表达式库


class 插件服务类{ 
    constructor(context){        //构造  创建对象实例时会执行一次
        this.context=context
        this.插件路径 = context.extension.extensionPath    //这里包含插件基本信息
   
        this.静态文件服务器=null
    }
    预览md文件(文件路径){
        this.执行指令("markdown.showPreview" , vscode.Uri.file(文件路径))
    }
    保存配置到电脑(配置对象){
        this.数据转为JSON写入到电脑( 配置对象.配置文件路径, 配置对象)
    }
    打开此插件侧边栏view视图(){
        this.执行指令("workbench.view.extension.lwleen_theme")
    }
    打开系统终端界面(路径){
        if(os.type()==="Linux") this.执行shell指令("x-terminal-emulator -w "+ 路径)
    }
    打开系统终端界面执行( 工作目录  ,可执行程序路径){
        if(os.type()==="Linux") {
            let 父路径=path.dirname(可执行程序路径)
            this.执行shell指令("x-terminal-emulator -w  "+工作目录+"  -e  "+ 可执行程序路径)
        }
    }
    
    创建http静态文件服务器(网址,端口, 静态文件路径){
        return new Promise((成功后回调,失败后回调)=>{
            if(this.静态文件服务器 !==null) this.静态文件服务器.close()
            
            this.静态文件服务器 = http.createServer(function(请求对象, 响应对象){

                let 中文url= decodeURI(请求对象.url)
                let 文件路径 = url.parse(中文url).href;  //这里是完整路径
                let 父路径 = path.dirname(文件路径)
                if(文件路径 === '/') 文件路径=path.join(静态文件路径, 文件路径);

                if(文件路径.match(静态文件路径) === null){ 文件路径=静态文件路径  }   // 超出

                try {
                    let 路径信息 = fs.statSync(文件路径);
                    if (路径信息.isFile()) {                        //此路径是文件
                            响应对象.setHeader('Content-Type', 'text/plain;charset=utf-8');
                            let 文件流 = fs.createReadStream(文件路径)
                            文件流.pipe(响应对象)
                            文件流.on('error', function(err){
                                响应对象.statusCode = 500
                                响应对象.end('error')
                            })
                    }else if(路径信息.isDirectory()){               //此路径是文件夹
                        //是目录，返回目录列表，让用户可以继续点击
                        let 原始目录数组 = fs.readdirSync( 文件路径,"utf-8" );
                        
                        let 文件属性数组 =[]
                        原始目录数组.forEach(文件名=>{
                            let 合成路径=path.join(文件路径, 文件名)
                            let 文件信息= fs.statSync(合成路径);
                            let 文件={}
                            if( 文件信息.isDirectory() ) {文件.类型="文件夹"} 
                            else {文件.类型="文件"}
                            文件.路径=合成路径
                            文件.文件名=文件名
                            文件.文件KB大小=Math.trunc(文件信息.size /1024) 
                            文件属性数组.push(文件)
                        })
                        文件属性数组.sort( function(a, b){
                            var x = a.类型;
                            var y = b.类型;
                            if (x < y) {return 1;}
                            if (x > y) {return -1;}
                            return 0;} )              //排序 文件夹在前
                        
                        let 合成网页文本= 文件属性数组.map(文件 =>{
                                        if( 文件.类型 === "文件夹"){
                                            return `
                                            <div>
                                                <a href="${文件.路径}">${文件.文件名}/</a>
                                            </div>`
                                        }else
                                            return `
                                            <div style="position: relative">
                                                <a href="${文件.路径}">${文件.文件名}</a>
                                                <a style="left:500px ; position: absolute">${文件.文件KB大小} KB</a> 
                                            </div>`
                                        
                                    }).join("")

                        let 网页文本 =`
                            <!DOCTYPE html>
                            <html lang="CN">
                                <head>
                                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                                    <style type="text/css">
                                        a{ font-size:14.5px; text-decoration:none;font-family:"noto sans"}
                                    </style>
                                    <title>护眼主题</title>
                                </head>
                                <body>
                                        <h1>${文件路径}</h1>
                                        <hr>
                                        <div style="">
                                            <a href="${父路径}" style="" >上一页/</a>
                                            ${合成网页文本}
                                        </div>
                                        <hr>
                                </body>
                            </html>
                            `
                        响应对象.end(网页文本);  //返回给网页
                    }else {
                        响应对象.end("文件读取出现未知错误");
                    }

                }catch(err){
                    响应对象.writeHead(404, "Not Found");
                    响应对象.end();
                }
            })
            this.静态文件服务器.listen(端口, 网址, () => {  成功后回调(`http://${网址}:${端口}`) })
        })
    }

    通过shell查找软件版本号(指令 ,正则表达式){
        return new Promise((成功后回调,失败后回调)=>{
            this.执行shell命令(指令)
                .then((返回值)=>{
                        let 版本号=this.查找版本号(正则表达式, 返回值.stdout)
                        成功后回调( 版本号 )//查找版本号
                    })
        })
    }
    遍历对象(对象){
        return new Promise((成功后回调,失败后回调)=>{
            let 配置名数组 = Object.getOwnPropertyNames(对象) 
            成功后回调(配置名数组)
        })
    }
    查找版本号(正则表达式,字符串 ){
        let 数组 =正则表达式.exec(字符串)  //查找版本号
        if(数组===null)  数组=["未安装"]
        return 数组[0]
    }
    正则查找字符串(正则表达式,字符串){
        return 正则表达式.exec(字符串) 
    }
    延时后执行(毫秒数){
        return new Promise((成功后回调, 失败后回调)=>{
            let 定时器=setTimeout(()=>{
                成功后回调()
                clearTimeout(定时器)
            } , 毫秒数)
        })
    }
    注册配置变化事件( 事件函数 ){ return  vscode.workspace.onDidChangeConfiguration( 事件函数  ) }
    获取用户定义值(配置){  return vscode.workspace.getConfiguration().get(配置)   }
    生效配置(官方配置, 属性){   vscode.workspace.getConfiguration().update( 官方配置, 属性, true )  }
    注册指令(指令, 处理函数){ this.context.subscriptions.push( vscode.commands.registerCommand(指令, 处理函数) ) }
    注册指令表(指令对应函数表){     // 格式为 { "指令id" : 函数 ,  }
         let 指令名数组 = Object.getOwnPropertyNames(指令对应函数表)  //取得所有的指令名
         指令名数组.forEach( 项 => {
            this.注册指令(项,指令对应函数表[项] )    
         })  
    }
    插件重启(){  //重启自身 
        this.执行指令("workbench.action.restartExtensionHost", "lwleen.lwleen-theme-vscode-plugin")  
    }
    执行指令(指令,...参数){ vscode.commands.executeCommand(指令, ...参数) }   //可变参数
    打开插件设置(){ this.执行指令( "workbench.action.openSettings","@ext:" + this.context.extension.id ) }  //打开指定的 设置UI
    打开插件某项设置(某项设置){
        switch(某项设置){                                                                               //此项的 id
            case "未打开仓库功能开关" : this.执行指令( "workbench.action.openSettings", "护眼主题.仓库功能开关🐋" )  ;break ;
            case "Shell 指令未定义！" : //与下面相同
            case "打开shell指令配置页面":this.执行指令( "workbench.action.openSettings", "护眼主题.shell指令🐠" ,true) ;break ;
            case "gitee仓库令牌为空" :this.执行指令( "workbench.action.openSettings", "护眼主题.gitee仓库令牌" ) ;break ;
            default: ;
        }
    }
    显示文件(绝对路径){   //这个只能打开文本
        vscode.workspace.openTextDocument( vscode.Uri.file( 绝对路径 ) )
                .then( 文件 => vscode.window.showTextDocument(文件) ) }
    打开文件(绝对路径){   this.执行指令('vscode.open', vscode.Uri.file(绝对路径)) }  //这个比上面显示文件更加全面 
    选择后显示文件(绝对路径, 标题文本, 打开按钮文本){
        vscode.window.showOpenDialog( { defaultUri: vscode.Uri.file(绝对路径) ,
                                        canSelectFiles:true ,
                                        canSelectFolders:false,
                                        canSelectMany:false,
                                        title:标题文本, 
                                        openLabel:打开按钮文本 })     //返回一个数组
                .then( 路径数组 => {
                    if (路径数组 !== undefined)   this.显示文件( 路径数组[0].path)   //选择多个文件只打开第一个 
                })                              //获得数据才处理            
    }
    打开窗口选择本地路径文件数组(绝对路径, 标题文本, 打开按钮文本){
        return new Promise(成功后回调 =>{
            vscode.window.showOpenDialog( { defaultUri: vscode.Uri.file(绝对路径) ,
                canSelectFiles:false ,
                canSelectFolders:true,
                canSelectMany:false,
                title:标题文本, 
                openLabel:打开按钮文本 })     //返回一个数组  
            .then(路径数组 => 成功后回调(路径数组))
        })   
    }
    打开插件目录(路径){this.执行指令('vscode.openFolder', vscode.Uri.file(路径), true) }  
    切换主题(){
        switch (this.获取用户定义值("workbench.colorTheme")){
            case "护眼主题——浅蓝🦄" : this.生效配置("workbench.colorTheme", "护眼主题——浅绿🦄"); break;
            case "护眼主题——浅绿🦄" : this.生效配置("workbench.colorTheme", "护眼主题——深色🦄"); break;
            case "护眼主题——深色🦄" : this.生效配置("workbench.colorTheme", "护眼主题——浅蓝🦄"); break;
            default: this.执行指令("workbench.action.selectTheme");
        }
    }
    生成终端界面(界面名称, 工作路径 , 欢迎信息){                                   //isTransient true  vs重启后不再打开旧终端窗口
        return vscode.window.createTerminal({ name:界面名称, cwd: 工作路径,  message:欢迎信息  ,isTransient:true}) 
    }
    终端激活事件(){
        vscode.window.onDidChangeActiveTerminal((终端)=>{ //参数是当前激活的终端
             
        })
    }
    vscode窗口激活事件(){
        vscode.window.onDidChangeWindowState((窗口)=>{ //参数是vscode软件聚焦激活 还是非激活
             console.log(窗口)
        })
    }
    获取终端数组(){    return vscode.window.terminals }
    生成输出界面(界面名称){ return vscode.window.createOutputChannel(界面名称 )}
    生成按钮(左右, 距离){
        if (左右 === "左边")  return vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 距离)
        else  return vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 距离)
    }
    终端执行后销毁(工作路径, 指令文本){
        let 终端 = this.生成终端界面("护眼主题 🐠" ,工作路径,  "正在执行 shell 指令 ... 🐠\n")  
        this.执行指令("workbench.action.terminal.focus", 终端)
        终端.sendText( "echo \"\n--> 开始执行指令 🐠 🐠 🐠\";" +  指令文本 + ";echo \"--> 指令执行完成 🐠 🐠 🐠\" ;sleep 2; exit")     
    }

    配置Linux(){
        let 脚本路径 = path.join(this.插件路径, "Linux脚本")
        let 配置Linux终端 = this.生成终端界面("护眼主题:配置Linux", 脚本路径, "欢迎，此脚本只适用于 Linux 系统")
        配置Linux终端.show()
        this.延时后执行(1000)
                .then(()=>{
                    if(os.type() !== "Linux"){
                        配置Linux终端.sendText("此系统非 Linux !!!")
                        return
                    }  
                    配置Linux终端.sendText("ls;echo;./入口.sh")
                })  
    }
    用系统默认应用打开(文件路径){  
        // vscode.env.openExternal
        if(os.type() === "Linux")   child_process.exec("xdg-open"+" "+ 文件路径 )
        else  child_process.exec("start"+" "+ 文件路径 )
    }

    执行shell指令( 指令 , 输出处理函数 ){
        console.log("📒执行shell指令📒护眼主题：执行了指令  \n" + 指令)
        if(os.type() === "Linux")   child_process.exec(指令, 输出处理函数)
        else  child_process.exec(指令 ,{encoding:"utf-8", shell:"PowerShell"},输出处理函数  )     // 如果不指定 PS 用的是cmd 
    }
    执行shell命令( 指令 ){
        return new Promise((成功后回调, 失败后回调)=>{
            //console.log("📒执行shell命令📒护眼主题：执行了指令   \n" + 指令)
            if(os.type() === "Linux"){
                child_process.exec(指令, (err,stdout,stderr)=>{
                        let 返回值={
                            err:err,
                            stdout:stdout,
                            stderr:stderr
                        }
                        成功后回调(返回值)
                })
            }   
            else {
                child_process.exec(指令 ,{encoding:"utf-8", shell:"PowerShell"},child_process.exec(指令, (err,stdout,stderr)=>{     
                    // 成功后回调(stdout,stderr,err)
                }) )     // 如果不指定 PS 用的是cmd 
            }
        })
    }
    获取vscode所有内部指令(){                
            vscode.commands.getCommands().then(allCommands => { // 获取所有命令
                console.log('📒获取vscode所有内部指令📒所有命令： ', allCommands);
            });
    }
    重启所有的webview页面(){
        this.执行指令("workbench.action.webview.reloadWebviewAction")
    }

    用git克隆仓库(仓库, 保存地址, 错误处理函数){
        if(os.type() === "Linux"){
            this.执行shell指令("git clone git@gitee.com:"+ 仓库.full_name + " " + 保存地址 , 错误处理函数 )
        }
        else{
            this.执行shell指令("git clone"+" "+ 仓库.html_url + " " + 保存地址 , 错误处理函数 )
        }
    }

    /*  //  作用 --------把回调函数取出来，放在.then里执行, 便于书写阅读
        // 成功后回调(传递参数)      对应.then(成功后回调) 方法    // 可以用 return 代替 成功后回调
        // 失败后回调(传递参数)      对应.then(成功后回调, 失败后回调) 方法
        // .then 可以有两个参数，或一个      
        // .catch(失败后回调)
         
        // .all 可以并行运行几个异步操作  并用数组返回所有操作结果
        // .race
        
        catch为then的语法糖，它是then(null, rejection)的别名。
        catch()捕捉的是整个promise执行过程中的异常情况。           放在最后捕捉异常，没有异常不执行

        reject[失败后回调]    是用来抛出异常，catch 是用来处理异常
        reject 是 Promise 的方法，而 catch 是 Promise 实例的方法
        reject后的东西，一定会进入then中的第二个回调，如果then中没有写第二个回调，则进入catch

        //Promise.reject() // 后面的程序不再执行

        return new Promise((成功后回调, 失败后回调) => {
                        成功后回调(返回值)  //只能有一个参数，  多个参数用一个传递
        })


        // ------->>>   resolve() 只能接受并处理一个参数，多余的参数会被忽略掉。 <<<--------------------
    */
    
    //文件操作相关
    数据转为JSON写入到电脑(路径, 数据){
        return new Promise((成功后回调, 失败后回调) => {
            /* fs.writeFile(路径, 数据,  (错误) => {
                if (错误)   失败后回调(错误)
                else 成功后回调()        
            })*/
            //
            let 数据JSON = JSON.stringify(数据 , null, 2 )  

            vscode.workspace.fs.writeFile( vscode.Uri.file(路径) , Buffer.from(数据JSON) ) 
                .then( () =>{
                    console.log("📒数据转为JSON写入到电脑📒护眼主题：写入数据到电脑----" +路径)
                    成功后回调()
                })
                .catch((错误)=>{
                    console.log("🐛数据转为JSON写入到电脑🐛护眼主题：无法写入----" +错误)
                    失败后回调(错误)
                })
        })
    }
    本地路径是否存在(文档路径){
        return new Promise((成功后回调, 失败后回调) => {
           /*  fs.access(git文档路径, 错误=>{
                if(错误) 失败后回调(错误)
                else 成功后回调()
             } )*/
            vscode.workspace.fs.stat( vscode.Uri.file(文档路径) ) 
               .then( 文件状态 =>{
                    if(文件状态.type === vscode.FileType.Directory)  成功后回调("文件夹")
                    else if(文件状态.type === vscode.FileType.File)  成功后回调("文件")
               })
               .catch( 错误 =>{
                    console.log("🐛本地路径是否存在🐛护眼主题：本地路径不存在----" +文档路径)
                    失败后回调(错误) 
               })
        })
    }
    读取本地文件(文件路径){
        return new Promise((成功后回调, 失败后回调) => {
         /*   fs.readFile(文件路径, (出错, 数据)=>{
                if(出错) 失败后回调(出错)
                else 成功后回调(数据)
            })*/
            vscode.workspace.fs.readFile( vscode.Uri.file(文件路径) ) 
                .then( (JSON数据) =>{
                    let 数据 = JSON.parse(JSON数据)  
                    console.log("📒读取本地文件📒护眼主题：读取本地文件----" +文件路径)
                    成功后回调(数据)
                })
                .catch((错误)=>{
                    console.log("🐛读取本地文件🐛护眼主题：读取本地文件----" +错误)
                    失败后回调(错误)
                })
        })
    }
    读取本地目录(路径){
        return new Promise((成功后回调, 失败后回调) => {
         /*   fs.readdir(路径 ,"utf-8", (错误, 文件数组=[] )=>{   
                if(错误) 失败后回调(错误)              //这种情况是无法访问文件夹  
                else 成功后回调(文件数组)             //空文件夹返回 []
            })
        */
            vscode.workspace.fs.readDirectory( vscode.Uri.file(路径) )
                .then(  文件信息数组=>{
                    成功后回调(文件信息数组) //  [ [文件名, 文件类型] , [文件名, 文件类型]]
                })
                .catch( 错误 =>{
                    console.log("🐛读取本地目录🐛护眼主题：读取本地目录----" +错误)
                    失败后回调(错误) 
               })
        })
    }
    重命名文件(路径 , 新路径){
        return new Promise((成功后回调, 失败后回调) => {
            vscode.workspace.fs.rename(  vscode.Uri.file(路径) ,  vscode.Uri.file(新路径), { overwrite: true })
                .then(()=>{
                    console.log("📒重命名文件📒护眼主题：重命名文件----" +新路径)
                    成功后回调()
                })
                .catch((错误)=>{
                    console.log("🐛重命名文件🐛护眼主题：无法重命名文件----" +路径)
                    失败后回调(错误) 
                })
        })
    }
    删除文件(路径){
        return new Promise((成功后回调, 失败后回调) => {
            vscode.workspace.fs.delete(  vscode.Uri.file(路径) ,{ recursive: true ,useTrash: true })  //可以删除文件夹   放到回收站
                .then(()=>{
                    console.log("📒删除文件📒护眼主题：删除文件----" +路径)
                    成功后回调()
                })
                .catch((错误)=>{
                    console.log("🐛删除文件🐛护眼主题：无法删除文件----" +路径)
                    失败后回调(错误) 
                })
        })
    }
    创建新文件(路径, 类型){
        return new Promise((成功后回调, 失败后回调) => {
            if(类型 === "文件夹"){
                    vscode.workspace.fs.createDirectory(vscode.Uri.file(路径) )
                    .then(()=>{
                        console.log("📒创建新文件📒护眼主题： 创建文件夹  " + 路径)
                        成功后回调()
                    })
                    .catch((错误)=>{
                        console.log("🐛创建新文件🐛护眼主题： 无法创建文件夹----  " + 错误)
                        失败后回调()
                    })
                
            }else{
                fs.writeFile(路径, '',  (错误) => {
                    if (错误){
                        console.log("🐛创建新文件🐛护眼主题： 无法创建文件----  " + 错误)
                        失败后回调(错误)
                    }   
                    else{
                        console.log("📒创建新文件📒护眼主题： 创建文件  " + 路径)
                        成功后回调()
                    }        
                })
            }
        })
    }

    复制文件(原路径, 目标路径){
        return new Promise((成功后回调, 失败后回调) => {
            vscode.workspace.fs.copy(vscode.Uri.file(原路径) , vscode.Uri.file(目标路径) ,{ overwrite: true }  )
                .then(()=>{
                    成功后回调()
                })
                .catch((错误)=>{
                    console.log("🐛复制文件🐛护眼主题： 复制文件----  " + 错误)
                    失败后回调()
                })
        })
    }
 
    //常用网页接口
    读取本地网页(相对路径){
        const 资源路径 = path.join(this.插件路径, 相对路径);
        const 目录路径 = path.dirname(资源路径);

        let 页面 = fs.readFileSync(资源路径, 'utf-8');  //读取文件
        //会自动将HTML文件中link、href、script、img的资源相对路径全部替换成正确的vscode-resource:绝对路径    ---- vscode不支持直接加载本地资源
        let 可用页面 = 页面.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
                return  $1 + vscode.Uri.file(path.resolve(目录路径, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
            }); 
        return 可用页面
    }

    创建网页面板(标题){                       //每个网页需要一个面板
        let 网页面板 = vscode.window.createWebviewPanel(
            'testWebview',                     // viewType
            标题,                               // 视图标题
            vscode.ViewColumn.One,             // 显示在编辑器的哪个部位
            {
                enableScripts: true,           // 启用JS，默认禁用
                retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置   影响性能
            },
            {   // 限制只能访问这个目录 [] 空表示限制访问
                localResourceRoots: [ vscode.Uri.file(this.插件路径) ]
            })
        return 网页面板
    }

    打开网页(相对路径, 标题){
        let 网页面板 = this.创建网页面板(标题)
        网页面板.webview.html = this.读取本地网页(相对路径)   // 显示网页
        return 网页面板
    }

    处理网页消息(网页面板, 处理函数){ // 网页面板接收消息    
        网页面板.webview.onDidReceiveMessage( 消息=>{ 处理函数(消息) }, undefined, this.context.subscriptions);
    }

    注册侧边栏显示网页(边栏id, 边栏网页路径 , 网页显示完成事件 ){  
        vscode.window.registerWebviewViewProvider( 边栏id, 
               {                                                   
                   resolveWebviewView: (显示面板)=>{      //由于这里是用户点击后, 网页加载显示，需要用事件传递参数
                       显示面板.webview.options={ 
                           enableScripts: true,
                           enableForms: true,
                           localResourceRoots: [ vscode.Uri.file(this.插件路径 )]
                       };
                       显示面板.webview.html=this.读取本地网页(边栏网页路径); 

                       网页显示完成事件.fire(显示面板)  // fire( 可传递参数 ) 可用于传递参数
                   }
               },
               {  webviewOptions:{ retainContextWhenHidden:true }  }  //保持内容
           )
    }

    //网络相关
    发起网络请求(请求类型, 网址, 参数 ={}){
        return new Promise( (成功后回调, 失败后回调) => {
                https.get(网址,{
                                url: 网址,
                                method: 请求类型,
                                data:参数,
                                headers: {  "content-type": "application/json", },
                                responseType: 'json',
                                responseEncoding: 'utf-8',},
                            回应对象 => {
                            let 数据数组 = [];
                            回应对象.on('data', 接收数据 => {
                                数据数组.push(接收数据);
                            });
                            回应对象.on('end', () => {
                                const 数据对象 = JSON.parse(Buffer.concat(数据数组))
                                成功后回调(数据对象)
                            });
                        }).on('error', 错误对象 => {
                            console.log('🐛发起网络请求🐛  Error: ', 错误对象.message);
                            失败后回调(错误对象)
                        });

                // 网络通讯({                        // 引入的第三方模块
                //             url: 网址,
                //             method: 请求类型,
                //             data:参数,
                //             headers: {  "content-type": "application/json", },
                //             responseType: 'json',
                //             responseEncoding: 'utf-8',
                //         })
                // .then( ( 应答 )=>{
                //     //    console.log("data   "+       应答.data);             //数据，已经转换为对象
                //     //    console.log("status   "+     应答.status);           //这个是状态码 200正常
                //     //    console.log("statusText   "+ 应答.statusText);       //状态是正常为 "OK"
                //     //    console.log("headers    "+   应答.headers);     
                //     //    console.log(应答.config);                            //这个是发出请求的配置
                //     成功后回调(应答.data)  
                // })
                // .catch(( 错误 )=>{              // 错误.response 的格式与上面相同
                //     if(错误.response)  {        // 请求已发出，且服务器的响应状态码超出了 2xx 范围
                //         vscode.window.showErrorMessage("护眼主题：访网站回信————" + 错误.response.data.message,"知道了") ;  
                //         return 失败后回调("护眼主题：网站回信————" + 错误.response.data.message) 
                //     }else if(错误.request){     // 请求已发出，但没有接收到任何响应
                //         vscode.window.showErrorMessage("护眼主题：无法连接网站！！！","知道了") ;  
                //         return 失败后回调("护眼主题：无法连接网站！！！") 
                //     }else{                     // 引发请求错误的错误信息
                //         vscode.window.showErrorMessage("护眼主题：出现错误————"+ 错误.message,"知道了") ;   
                //         return 失败后回调("护眼主题：出现错误————"+ 错误.message)   // rej 后面所有.then 都不再执行
                //     }
                // })
            })
    }



    //下面备用

    // vscode.DocumentSemanticTokensProvider 实现可编程的语义分析   「Sematic Tokens Provider」 是 vscode 内置的一种对象协议，它需要自行扫描代码文件内容，然后以整数数组形式返回语义 token 序列，告诉 vscode 在文件的哪一行、那一列、多长的区间内是一个什么类型的 token。
    // 告诉 vscode 在文件的哪一行、那一列、多长的区间内是一个什么类型的 token(比如变量)。 
    

    输入文本事件(){  //每次输入都会触发
        vscode.workspace.onDidChangeTextDocument( (变化事件)=>{
            console.log('📒输入文本事件📒'+ 变化事件.contentChanges.length)
 
        })
        
    }

    创建问题诊断集合( 名称 ){
        return vscode.languages.createDiagnosticCollection(名称); //创建问题诊断集合
    }
    
    添加问题诊断( 问题诊断集合 , 编辑器, 起始位置, 结束位置 ){
        问题诊断集合.set(编辑器.document.uri, [{     //vscode内部代码诊断
            message: '异常中文标点',
            range: new vscode.Range(起始位置, 结束位置),
            severity: vscode.DiagnosticSeverity.Warning    
       } ])  
    }

    获取当前编辑器(){  return vscode.window.activeTextEditor }

    内容坐标( 编辑器, 位置 ){  return 编辑器.document.positionAt(位置)}

    对内容装饰(编辑器, CSS样式 , 起始位置, 结束位置){   //对页面代码进行外观上的装饰
        编辑器.setDecorations( vscode.window.createTextEditorDecorationType({   CSS样式 })   //某段范围添加一些 CSS
        ,[{
            range: new vscode.Range(起始位置, 结束位置)
        }])
    }
    注册代码自动补全(补全条目, 悬浮菜单 ){
        this.context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider()
        )
    }
}

class gitee仓库服务类 extends 插件服务类{
    constructor(context){        //构造  创建对象实例时会执行一次
        //super作为函数使用，代表父类的构造函数，只能用在子类的构造函数中；
        super(context)           //代表的是父类的构造函数  但它内部的this指向的是当前子类的构造函数

        this.启用仓库功能 = null  //是否启用仓库功能
        
        this.用户画像 ={ 令牌:"",  id:"",  用户名:"",   昵称:"",   邮箱:"",   }
  
          
    }
    查询是否启用仓库功能(是否){
        this.启用仓库功能 = 是否
        return this.启用仓库功能
    }

    获得gitee用户资料(令牌) { 
        return  this.发起网络请求('get', `https://gitee.com/api/v5/user?access_token=${令牌}`) 
                                .then( 数据 =>{
                                    this.用户画像.令牌 = 令牌
                                    this.用户画像.id   = 数据.id   
                                    this.用户画像.用户名 = 数据.login //lwleen
                                    this.用户画像.昵称  = 数据.name   //一切时空过去未来
                                    this.用户画像.邮箱 = 数据.email   //lwleen@qq.com
                                })   
    }
    获取仓库README(用户名, 仓库路径){
            return this.发起网络请求('get', `https://gitee.com/api/v5/repos/${用户名}/${仓库路径}/readme`)  //分支 master
                                
    }
    获得所有仓库目录(令牌, 仓库排序选项){   // 不超过100个仓库
            return this.发起网络请求('get', `https://gitee.com/api/v5/user/repos?access_token=${令牌}&sort=${仓库排序选项}&page=1&per_page=100`)  
    }

}

class 侧边栏服务类 extends 插件服务类{
    constructor(context, 栏目id){        //构造  创建对象时会执行一次
        this.数据 = [  ]    
        this.数据改变事件 = new vscode.EventEmitter() 
        this.创建侧边栏目(栏目id)
    }
    数据显示(输入数据){    //函数
        this.数据 = 输入数据
        this.数据改变事件.fire()   //触发数据改变事件
    }
    行显示(行号, 对象){             //不传入指令会报错 if
        this.数据[行号 -1] = 对象   //数组 0 1 2 索引 代表 第1 2 3号元素
        this.数据改变事件.fire() 
    }
    创建侧边栏目2(栏目id){  //(未使用) 第二种有两种接口 vscode.window.registerTreeDataProvider
        vscode.window.registerTreeDataProvider(栏目id, {    //第二个参数是对象 treeDataProvider
            getTreeItem: a => a,                      
            getChildren: _ => this.数据.map( 项 => {                 //以此处理每个数组成员
                var 显示条目 = vscode.TreeItem(项.显示文本);          //处理字符串后,获得一个对象  是一个TreeItem对象 ,所有要 return 它就是要显示的数据 对象
                if(项.图标地址) 显示条目.iconPath = {
                    light:vscode.Uri.file(path.join(this.插件路径 , 项.图标地址.light)),//绝对地址  加 if 因为空会报错
                    dark:vscode.Uri.file(path.join(this.插件路径 , 项.图标地址.dark))
                }
                显示条目.id = 显示条目.id || 项.显示文本 ;
                显示条目.command ={          
                        title: 项.显示文本,        
                        command: 项.指令    };                        
                return 显示条目                                
            }),
            onDidChangeTreeData: this.数据改变事件.event
        }) 
    }
    创建侧边栏目(栏目id){  //第一种接口  vscode.window.createTreeView 这个接口有很多配置
        vscode.window.createTreeView(栏目id, {  //第二个参数 对象 TreeViewOptions 
                treeDataProvider:{              //它的第一个成语 是个对象 treeDataProvider
                    getTreeItem: a => a,
                    getChildren: _ => this.数据.map( 项 => {          //以此处理每个数组成员    //处理字符串后,获得一个对象  是一个TreeItem对象 ,所有要 return 它就是要显示的数据 对象
                       let 显示条目 = vscode.TreeItem(项.显示文本);    
                       if(项.图标地址.light && 项.图标地址.dark)         //判断存在路径
                            显示条目.iconPath = {
                                light:vscode.Uri.file(path.join(this.插件路径 , 项.图标地址.light) ) ,
                                dark:vscode.Uri.file(path.join(this.插件路径 , 项.图标地址.dark)) 
                           };  
                        if(项.指令)  显示条目.command ={                    //这里传入空会报错 
                                            title: 项.显示文本,        
                                            command: 项.指令, 
                                            arguments: [ 项.显示文本 ]  };  // 很重要 !!! ----> 这个是点击条目动作时，传递给指令的参数
                   //     显示条目.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;  //折叠状态 用于文件目录树
                        return 显示条目                                
                    }),
                    onDidChangeTreeData: this.数据改变事件.event
                },
                showCollapseAll:false,
                canSelectMany:false
        })
    }
    侧边栏显示通知( 通知文本 , 秒 ){                             //第1行显示通知
         this.行显示(  1 ,{ 显示文本: 通知文本, 指令: "", 图标地址:{light:"./资源/图标/19消息.png" ,dark:"./资源/图标/反色/1-19消息.png"} } )
         let 定时器 = setTimeout(   ()=> {
            this.行显示(1 ,{ 显示文本:"" , 指令: "", 图标地址:{} }) 
            clearTimeout(定时器)
         } ,  秒 * 1000 )   // 单位 ms 
    }
}

class 网页服务类 extends 插件服务类{
    constructor(context){        //构造  创建对象实例时会执行一次
        //super作为函数使用，代表父类的构造函数，只能用在子类的构造函数中；
        super(context)           //代表的是父类的构造函数  但它内部的this指向的是当前子类的构造函数
       
        this.侧边栏网页_消息处理函数
        this.侧边栏网页存在= false
        this.侧边栏网页面板= {}
        this.侧边栏网页加载完成事件 =  {}

        this.用户home路径 = os.homedir() ;  
    }
     

    加载侧边栏网页(){
        // 这个函数里有 事件fire(网页面板)
        this.注册侧边栏显示网页("护眼主题.侧边栏.设置" , "./资源/侧边页.html"  , this.侧边栏网页加载完成事件) 

        this.侧边栏网页加载完成事件.event( 网页面板 =>{
            this.侧边栏网页面板 = 网页面板
            this.侧边栏网页存在 = true
            //注册网页面板消息事件
            网页面板.webview.onDidReceiveMessage( this.侧边栏网页_消息处理函数  )
        }) 
    }
  
    注册网页面板消息事件( 网页面板 , 事件回调函数){
        网页面板.webview.onDidReceiveMessage( 事件回调函数 )
    }
       
    发送信令到侧边栏网页(信令对象){
        if(this.侧边栏网页存在)  this.侧边栏网页面板.webview.postMessage( 信令对象 );
    }
    
    数组里是否有子集(数组, 子集元素){
        if(数组.includes(子集元素)) return true
        else return false
    }

    字符串是否有子集(字符串, 子集字符串){
        //  includes  是测试数组
        if( 字符串.search(子集字符串) === 0) return true
        else  return false
    }

    遍历目录写入子文件数组(目录数组,  父路径 , 父文件夹打开状态 , 子文件数组 ){   //子文件数组 的路径最长
        目录数组.forEach(文件项=>{
            if(this.字符串是否有子集(父路径,  文件项.路径)){   
                if(父路径 === 文件项.路径 ){            //找到
                    文件项.子文件数组=子文件数组
                    文件项.打开状态=父文件夹打开状态
                    return 文件项  //父路径   对应的文件项
                }else{
                    this.遍历目录写入子文件数组(文件项.子文件数组, 父路径 , 父文件夹打开状态 , 子文件数组 )  // 路径包含，即是上级目录，继续查询
                }
            }else return
        })
    }

    查询文件夹内容_发送给侧边栏网页(全局配置对象 , 父目录){  //发送  信令格式  { 类型: "更新文件夹目录", 文件夹数组: 文件夹数组 }
        return new Promise((成功后回调,失败后回调)=>{
            this.读取本地目录(父目录)
                .then((子文件信息数组)=>{
                    let 文件夹数组 = []
                    子文件信息数组.forEach( 文件项 =>{
                        let 路径 = path.join(父目录, 文件项[0])  //数组第一个是文件名  第二个是文件类型
                        let 类型 = ''
                        if( 文件项[1] === vscode.FileType.Directory ) 类型 = "文件夹"
                        else 类型 = "文件"
                        let 文件对象 = {
                            文件名: path.basename(路径),
                            类型:类型,                       // "文件" / "文件夹"
                            扩展名:path.extname(路径),
                            路径: 路径,                      //作为 id
                            父路径:path.dirname(路径),       //作为父文件夹 id
                            gitee仓库: null,                 //是否被打开
                            仓库: fs.existsSync(path.join(路径,".git","index")),  //是不是普通仓库
                            打开状态:false,
                            子文件数组:[]                       //存放子文件
                        }
                        文件夹数组.push( 文件对象 )
                    } )

                    文件夹数组.sort( function(a, b){
                        var x = a.类型;
                        var y = b.类型;
                        if (x < y) {return 1;}
                        if (x > y) {return -1;}
                        return 0;} )              //排序 文件夹在前
                      
                    this.遍历目录写入子文件数组(全局配置对象.根目录数组 ,父目录, true , 文件夹数组 )
                    
                    //this.发送信令到侧边栏网页( { 类型: "插件信令.更新显示文件树", 父路径: 父目录 , 文件夹数组: 文件夹数组 } )
                    this.发送信令到侧边栏网页({类型:"插件信令.更新显示文件树", 目录数组: 文件夹数组})
                    
                    //this.保存配置到电脑(全局配置对象)
                    //console.log("📒查询文件夹内容_发送给侧边栏网页📒护眼主题: 查询文件夹内容" + 父目录)
                    成功后回调()  
                    // let 返回值={
                    //     父路径: 目录地址,
                    //     文件夹数组:文件夹数组
                    // }
                    
                })
                .catch((错误)=>{
                    console.log("🐛查询文件夹内容_发送给侧边栏网页🐛护眼主题:无法访问文件夹" + 错误)
                })
        }) 
    }

    打开窗口选择本地根目录_发送给侧边栏网页(全局配置对象){
        return new Promise((成功后回调,失败后回调)=>{
                    // 每次只能选择一个
                this.打开窗口选择本地路径文件数组( this.用户home路径 , "选择本地文件夹" ,"打开文件夹")
                    .then( 路径数组 => {   
                        if(路径数组 === undefined) return;
                        
                        let 路径 = ''
                        if(os.type() === "Linux"){
                            路径 = path.normalize(路径数组[0].path)            // vscode的特殊格式，需要转化为正常路径
                        }
                        else {
                            路径 = path.normalize(路径数组[0].path).substr(1)   // vscode的特殊格式，需要转化为正常路径
                        }
                        let 根目录 = {
                                文件名: path.basename(路径),
                                类型:"文件根目录",                   // "文件" / "文件夹"
                                扩展名:"",
                                路径: 路径,                      //作为 id
                                父路径:path.dirname(路径),       //作为父文件夹 id
                                gitee仓库: null,                 //是否被打开
                                仓库: fs.existsSync(path.join(路径,".git","index")),  //是不是普通仓库
                                打开状态:false,
                                子文件数组:[]                       //存放子文件
                            }
                        if(全局配置对象.根目录数组.filter(项 => 项.路径 === 根目录.路径).length === 0){

                            全局配置对象.根目录数组.unshift(根目录)       //不存在保存   pop 结尾添加   unshift 开头
                            this.发送信令到侧边栏网页({类型:"插件信令.更新显示文件树", 目录数组: 全局配置对象.根目录数组})

                            //this.保存配置到电脑(全局配置对象)

                            console.log("📒打开窗口选择本地根目录_发送给侧边栏网页📒护眼主题: 添加文件根目录\n")
                            成功后回调()
                        }else{
                            console.log("🐛打开窗口选择本地根目录_发送给侧边栏网页🐛护眼主题: 该目录已经存在\n")
                        }     
                } )  
        })
    }
   
    根目录标记仓库后_发送给侧边栏网页(全局配置对象 , 操作){    //刷新仓库     侧边页启动
        return new Promise((成功后回调,失败后回调)=>{
            this.标记仓库数据(全局配置对象.所有仓库, 全局配置对象.仓库本地路径)
                .then((所有仓库)=>{

                    if( ["刷新仓库",'删除本地仓库'].includes(操作) ){ // 删除旧仓库
                        全局配置对象.根目录数组 = 全局配置对象.根目录数组.filter(根目录项 => 根目录项.gitee仓库 === null )  //去掉旧的   //删除已经存在
                    }

                    所有仓库.forEach((仓库项)=>{
                        let 仓库项根目录={
                            文件名: 仓库项.name,
                            类型:"仓库根目录",                   // "文件" / "文件夹"
                            扩展名:"",
                            路径: 仓库项.路径,                      //作为 id
                            父路径:path.dirname(仓库项.路径),       //作为父文件夹 id
                            gitee仓库: 仓库项,               //是否被打开
                            仓库: fs.existsSync(path.join(仓库项.路径,".git","index")),  //是不是普通仓库
                            打开状态:false,
                            子文件数组:[]                       //存放子文件
                        }

                        //----->如果旧仓库存在，保留其子文件数组 
                        let 旧仓库根目录= 全局配置对象.根目录数组.filter(根目录项 => 根目录项.路径 === 仓库项根目录.路径 )[0]
                        if(旧仓库根目录){
                            仓库项根目录.子文件数组=旧仓库根目录.子文件数组
                            仓库项根目录.打开状态=旧仓库根目录.打开状态
                        }

                        //删除旧的，再添加新的
                        全局配置对象.根目录数组 = 全局配置对象.根目录数组.filter(根目录项 => 根目录项.路径 !== 仓库项根目录.路径 )  //去掉旧的   //删除已经存在
                        全局配置对象.根目录数组.push(仓库项根目录)
                    })

                    this.发送信令到侧边栏网页({类型:"插件信令.更新显示文件树", 目录数组: 全局配置对象.根目录数组})

                    if(操作 === "刷新仓库")  this.保存配置到电脑(全局配置对象)

                    console.log("📒根目录标记仓库后_发送给侧边栏网页📒护眼主题: 更新显示文件树\n")
                    成功后回调()
                })
        })
    }

    标记仓库数据(所有仓库, 仓库本地路径){
        return new Promise((成功后回调,失败后回调)=>{
            if(!所有仓库) return;
            fs.access(仓库本地路径,(错误)=>{
                    if(错误){
                        fs.mkdirSync(仓库本地路径)   //不存在时，创建文件
                        console.log("🐛标记仓库数据🐛护眼主题: 本地没有仓库文件夹，新创建"+ 仓库本地路径)
                    } 

                    //无论是否出错，都会执行到这里 //判断 fs.readdir 读取的结果  
                    this.读取本地目录(仓库本地路径)
                    .then((文件信息数组)=>{   //文件夹项 数组第一个是文件名  第二个是文件类型
                        所有仓库.forEach((仓库项)=>{  
                            let 文件 =  文件信息数组.filter( 文件夹项=>  文件夹项[0] === 仓库项.path )[0] 

                            仓库项.路径 = path.join(仓库本地路径, 仓库项.path  )
                            仓库项.已下载 = false //默认未下载
                            if (文件 !== undefined && 仓库项.path === 文件[0] ){    //不存在的文件夹 文件 = undefined
                                    仓库项.已下载 = true //添加属性 标记已经下载仓库 
                            } 
                        })
                        成功后回调(所有仓库)
                    })

            })
            
        }) 
    }

}

class 标点转换服务类 extends 插件服务类{
    constructor(context){        //构造  创建对象实例时会执行一次
        //super作为函数使用，代表父类的构造函数，只能用在子类的构造函数中；
        super(context)           //代表的是父类的构造函数  但它内部的this指向的是当前子类的构造函数
        this.中转英标点转换开启 = false
        this.中英标点转换按钮 = {}
        // 插件服务.注册代码自动补全( provideCompletionItems, resolveCompletionItem )  
        this.中转英标点转换实例 = {}

        this.标点切换支持的语言 = [   
            {scheme: 'file', language: 'c' },                            
            {scheme: 'file', language: 'cpp' },      //C++
            {scheme: 'file', language: 'csharp' },   //C#  
            {scheme: 'file', language: 'python' },
            {scheme: 'file', language: 'go' },
            {scheme: 'file', language: 'java' },
       //   {scheme: 'file', language: 'json' },
            {scheme: 'file', language: 'html' },
            {scheme: 'file', language: 'css' },
            {scheme: 'file', language: 'javascript'},         
            {scheme: 'file', language: 'typescript' },
            {scheme: 'file', language: 'shellscript' },
        ]
        
        this.标点转换开关事件 = {}
    } 
    生成中英标点界面按钮(){
        //生成界面按键，以及图标的显示状态
        this.中英标点转换按钮 = this.生成按钮("左边",4.5)
        this.中英标点转换按钮.command = "护眼主题.中英标点转换" ;     // 此指令触发切换开关
        this.中英标点转换按钮.show();
    }

    开关中英标点转换(开关){  
        if(this.中转英标点转换开启 === false  && 开关 === true){ 
            // console.log("📒开关中英标点转换📒护眼主题：中转英标点转换开启🍺")     //问题 : 如果输入特别快,会来不及触发补全  
            this.中转英标点转换开启 = true                   //问题 : 此插件有效果  ---> 安装插件 vscode eslint 即 dbaeumer.vscode-eslint
            this.中文标点符号 = ['。', '，', '“', '”','‘','’','！', '：',"【","】","（","）",'》','《','；','？','￥','……','·']         
            this.中转英标点转换实例 = vscode.languages.registerCompletionItemProvider(  
                      this.标点切换支持的语言,                                          //第一个参数 选择对哪些类型文件生效
                      { provideCompletionItems: this.中转英标点转换回调函数 },           //第二个参数  回调函数 用于生成提示项数组
                      this.中文标点符号  )                                              //第三个参数，触发字符 空为全部触发    
            this.标点转换开关事件.fire(this.中转英标点转换开启)
        }else if(this.中转英标点转换开启 === true && 开关 === false ){
            // console.log("📒开关中英标点转换📒护眼主题：中转英标点转换关闭🧊")
            this.中转英标点转换开启 = false
            this.中转英标点转换实例.dispose();  // 销毁实例，即关闭转换功能
            this.标点转换开关事件.fire(this.中转英标点转换开启)
        }else   ; //无需再开 

        // 切换左下角指令图标
        if(vscode.window.activeTextEditor){   //在编辑器里才能切换 修改图标状态
            if( 开关 && this.是否支持语言(vscode.window.activeTextEditor.document.languageId) ) {
                this.中英标点转换按钮.text = "🍺";   // 开启转换, 且支持此语言
            }else  this.中英标点转换按钮.text = "🧊";
    
            if( this.是否支持语言(vscode.window.activeTextEditor.document.languageId) === false){ 
                this.中英标点转换按钮.command = null ;    //不支持的语言禁止切换
            }else this.中英标点转换按钮.command = "护眼主题.中英标点转换" ;
        }
    }
    中转英标点转换回调函数(document, position, token, context){   
        const 中英符号替换表 ={        
            '。':'.','，':',','“':'""', '”':'""','‘':'\'\'','’':'\'\'','！':'!','：':':','【':'[]',
            '】':'[]','（':'()','）':'()','》':'>','《':'<','；':';','？':'?','￥':'$','……':'^',
            '——':'-','、':'/','·':'`'
        }
        //由中文符号触发的代码补全     注释里并不会触发代码补全  所以不需要考虑注释代码的情况
        let 活动编辑器 = vscode.window.activeTextEditor
        if (!活动编辑器) { return null}
        let 当前光标位置 = 活动编辑器.selection.active;   // {line: 0  , character:0}  编辑器左上角为坐标 0 0   line 是第几行 
        let 光标前一个字符 = new vscode.Position(当前光标位置.line,当前光标位置.character -1)
        let 中文符号范围 = new vscode.Range(光标前一个字符, 当前光标位置 )  
        let 当前输入的字符 = 活动编辑器.document.getText(中文符号范围)

        let 对映英文字符 = 中英符号替换表[当前输入的字符]     
    
        if(当前输入的字符 === '—'){
            当前输入的字符 = '——'
            对映英文字符= '-'
            中文符号范围 = new vscode.Range(new vscode.Position(当前光标位置.line,当前光标位置.character -2) ,当前光标位置)
        }
        else if(当前输入的字符 === '…'){
            当前输入的字符 = '……'
            对映英文字符= '^'
            中文符号范围 = new vscode.Range(new vscode.Position(当前光标位置.line,当前光标位置.character -2) ,当前光标位置)
        }else{ }
        
        if(typeof(对映英文字符) === "string"){
            活动编辑器.edit( (编辑内容)=>{  编辑内容.replace(中文符号范围, 对映英文字符)} ,   //将中文字符 替换成英文字符
                                          { undoStopAfter: false, undoStopBefore: false} )
                    .then( ()=>{
                        if(对映英文字符.length === 2){                       
                            vscode.commands.executeCommand("cursorLeft")    //会出现选中字符情况，移动光标到中间
                        }
                        if(对映英文字符=== '.'){
                            vscode.commands.executeCommand('editor.action.triggerSuggest')  //触发建议
                        } 
                        //  vscode.commands.executeCommand('vscode.executeCompletionItemProvider', document.uri, position)
                        //       .then((补全词条数组) =>{  console.log(补全词条数组)} )
              })
            // console.log("📒中转英标点转换回调函数📒护眼主题：发现中文标点🍺--> "+当前输入的字符+ "\n位置： " + (光标前一个字符.line+1).toString() +"行  " + (光标前一个字符.character+1).toString()+ "列")    
        }
        return null     //仅借用触发机制，不修改补全内容         
        //  let 显示条目 = new vscode.CompletionItem(替换字符);
        //  return new vscode.CompletionList([显示条目], true);   
    }   

    是否支持语言( 语言 ){                   // 筛选是否有此语言 ，没有长度为0
        if(语言){                         // ['.vue'].includes(fileType(document?.document.fileName))
            if(this.标点切换支持的语言.filter( 项 => 项.language === 语言).length )  return true;
            else return false;
        }
    }
    注册中转英标点转换切换文本事件( ){
        vscode.window.onDidChangeActiveTextEditor( (事件) =>{   //让转换标志 随着不同文本变化
            if(事件 === undefined) {        //比如配置页面，出现 undefined
                this.中英标点转换按钮.text = "";   
            }else{     
                if( this.是否支持语言(事件.document.languageId)  && this.中转英标点转换开启 ){
                        this.中英标点转换按钮.text = "🍺";   //支持此语言且已经开启转换
                }else   this.中英标点转换按钮.text = "🧊";   //不支持此语言
        
                if( this.是否支持语言(事件.document.languageId) === false){ 
                      this.中英标点转换按钮.command = null ;    //不支持的语言禁止切换
                      this.中英标点转换按钮.text = "🧊";        //不支持此语言
                }else this.中英标点转换按钮.command = "护眼主题.中英标点转换" ;
            }
        } )
    }
    
  
} 

class 主页服务类 extends 插件服务类{
    constructor(context){        //构造  创建对象实例时会执行一次
        //super作为函数使用，代表父类的构造函数，只能用在子类的构造函数中；
        super(context)   
    
        this.主页_消息处理函数
        this.主页面板 =null
    }
    显示主页(){
        this.主页面板  = this.打开网页("./资源/主页.html","欢迎")
        this.主页面板.onDidDispose(()=>{
            this.主页面板=null             //用户主动关闭时
            console.log("📒显示主页📒护眼主题：欢迎主页已关闭")
        })

        this.处理网页消息(this.主页面板, this.主页_消息处理函数 )
    }
    发送信令到主页面板(信令对象){
        if(this.主页面板 !==null )  this.主页面板.webview.postMessage( 信令对象 );
    }
}


var 全局_配置对象={
    配置文件路径 :"",
    Linux设置脚本路径:"",
    根目录数组: [],
    仓库本地路径: path.join( os.homedir(), "./gitee" ) ,
    所有仓库 : [],
}

function 运行插件(context) {  
    console.log("📒运行插件📒护眼主题：插件启动 🎉🎉🎉 \n\n\n\n")

    全局_配置对象.配置文件路径= path.join(context.extension.extensionPath, "配置文件.json")
    全局_配置对象.Linux设置脚本路径= path.join(context.extension.extensionPath,'Linux脚本' ,"入口.sh")

    const 标点转换服务 = new 标点转换服务类(context)
    const 插件服务 =    new 插件服务类(context)      //context 插件的各种参数信息
    const 侧边页服务 =  new 网页服务类(context)      
    const 仓库服务 =    new gitee仓库服务类(context)
    const 主页服务 =    new 主页服务类(context)
    
    //启动   自用,启动脚本
    if(os.type() === "Linux" && os.userInfo().username === "lwl"){  //没有注册指令  lwl 时，自动打开终端
        插件服务.执行shell指令('[ -z "$(type -a lwl 2>/dev/null)" ] && x-terminal-emulator -e '+ 全局_配置对象.Linux设置脚本路径)
    } 


    标点转换服务.生成中英标点界面按钮()
    标点转换服务.注册中转英标点转换切换文本事件()     //切换文本后，切换图标

    侧边页服务.侧边栏网页加载完成事件 =  new vscode.EventEmitter()   //事件接口 
    侧边页服务.加载侧边栏网页()

    
    标点转换服务.标点转换开关事件 = new vscode.EventEmitter()
    标点转换服务.标点转换开关事件.event((开关)=>{
        if(开关) 侧边页服务.发送信令到侧边栏网页({类型:"插件信令.切换中英标点图表明亮度", 开关:开关})
        else     侧边页服务.发送信令到侧边栏网页({类型:"插件信令.切换中英标点图表明亮度", 开关:开关})
    })

    主页服务.主页_消息处理函数 = function(信令){
        const 信令对应函数表 = {  
                '主页信令.菜单.打开网页':()=>{
                    插件服务.用系统默认应用打开(信令.网址)
                },
                '主页信令.启动.查询git状态' :()=>{
                    let 信令={}
                    信令.类型='插件信令.启动.git状态'
                    插件服务.通过shell查找软件版本号('git --version', /[\d.]+/g)
                        .then((版本号)=>{
                            信令.git版本 = 版本号   //查找版本号
                            主页服务.发送信令到主页面板(信令)
                        })
                    插件服务.执行shell命令('git config user.name')
                        .then((返回值)=>{
                            信令.git用户名=返回值.stdout
                            主页服务.发送信令到主页面板(信令)
                        })
                    插件服务.执行shell命令('git config user.email')
                        .then((返回值)=>{
                            信令.git邮箱=返回值.stdout
                            主页服务.发送信令到主页面板(信令)
                        })
                    插件服务.执行shell命令('yes "yes" | ssh -T git@gitee.com ')
                        .then((返回值)=>{
                            let 数组 = 插件服务.正则查找字符串(/successfully/g, 返回值.stdout)   
                            if ( 数组!==null && 数组[0] === "successfully") 信令.gitee安全连接= "已开启"
                            else 信令.gitee安全连接= "未开启"
                            主页服务.发送信令到主页面板(信令)
                        })
                    插件服务.通过shell查找软件版本号("python3 --version",/[\d.]+/g)
                        .then((版本号)=>{
                            信令.python版本 = 版本号
                            主页服务.发送信令到主页面板(信令)
                        })
                    插件服务.通过shell查找软件版本号("pip3 --version",/pip\s[\d.]+/g)
                        .then((版本号)=>{
                            信令.pip3版本 = 版本号
                            主页服务.发送信令到主页面板(信令)
                        })
                    插件服务.通过shell查找软件版本号("putty --version", /[\d.]+/g)
                        .then((版本号)=>{
                            信令.putty版本 = 版本号
                            主页服务.发送信令到主页面板(信令)
                        })
                },
                '主页信令.启动.查询nodejs状态' :()=>{
                    let 信令={}
                    信令.类型='插件信令.启动.nodejs状态'
                    插件服务.通过shell查找软件版本号('node --version', /v[\d.]+/g)
                        .then((版本号)=>{
                            信令.nodejs版本=版本号
                            主页服务.发送信令到主页面板(信令) 
                        })
                    插件服务.通过shell查找软件版本号('npm --version', /[\d.]+/g)
                        .then((版本号)=>{
                            信令.nodejs_npm版本=版本号
                            主页服务.发送信令到主页面板(信令) 
                        })
                    插件服务.执行shell命令('timeout 2 npm config get registry')
                        .then((返回值)=>{
                            信令.nodejs_npm仓库=返回值.stdout
                            主页服务.发送信令到主页面板(信令) 
                        })
                    插件服务.通过shell查找软件版本号('vsce --version', /[\d.]+/g) 
                        .then((版本号)=>{
                            信令.vsce版本=版本号
                            主页服务.发送信令到主页面板(信令) 
                        })
                    插件服务.执行shell命令('vsce ls-publishers ')
                        .then((返回值)=>{
                            let 数组 =插件服务.正则查找字符串(/[\w]+\s/g, 返回值.stdout)  //查找版本号
                            if(数组===null)  数组=["空"]
                            信令.vsce登陆用户=数组[0]
                            主页服务.发送信令到主页面板(信令)
                        })
                    插件服务.通过shell查找软件版本号('electron-forge --version', /[\d.]+/g) 
                        .then((版本号)=>{
                            信令.electron_forge版本=版本号
                            主页服务.发送信令到主页面板(信令) 
                        })
                    插件服务.通过shell查找软件版本号('rpm --version', /[\d.]+/g) 
                        .then((版本号)=>{
                            信令.rpm版本=版本号   //查找版本号
                            主页服务.发送信令到主页面板(信令) 
                        })
                },
                '主页信令.启动.查询常用软件状态':()=>{
                    let 信令={}
                    信令.类型='主页信令.启动.常用软件状态'
                    插件服务.通过shell查找软件版本号('code --version' , /[\d.]+/g,)
                        .then((版本号)=>{
                            信令.vscode版本=版本号
                            主页服务.发送信令到主页面板(信令)  
                        })
                    插件服务.通过shell查找软件版本号('/opt/microsoft/msedge/msedge -version', /[\d.]+/g)
                        .then((版本号)=>{
                            信令.msedge版本=版本号
                            主页服务.发送信令到主页面板(信令) 
                        })
                    插件服务.通过shell查找软件版本号('qbittorrent --version', /[\d.]+/g)
                        .then((版本号)=>{
                            信令.qbtorrent版本=版本号
                            主页服务.发送信令到主页面板(信令) 
                        })
                    插件服务.通过shell查找软件版本号('VirtualBox --help',/v[\d.]+/g)
                        .then((版本号)=>{
                            信令.vbox版本=版本号
                            主页服务.发送信令到主页面板(信令) 
                        })
                    插件服务.执行shell命令('find /opt/xdman/xdman')
                        .then((返回值)=>{
                            let 数组=插件服务.正则查找字符串(/^\/opt\/xdman\/xdman/g, 返回值.stdout)  
                            if(数组===null)  数组=["未安装"]
                            else 数组=["已安装"]
                            信令.xdm下载工具=数组[0]
                            主页服务.发送信令到主页面板(信令) 
                        })
                    插件服务.通过shell查找软件版本号('krita --version',/[\d.]+/g)
                        .then((版本号)=>{
                            信令.krita版本=版本号
                            主页服务.发送信令到主页面板(信令)
                        })  
                    插件服务.通过shell查找软件版本号('nomacs --version', /[\d.]+/g)
                        .then((版本号)=>{
                            信令.nomacs版本=版本号
                            主页服务.发送信令到主页面板(信令)
                        })   
                    插件服务.通过shell查找软件版本号('gimp --version | head -1', /[\d.]+/g)
                        .then((版本号)=>{
                            信令.gimp版本=版本号
                            主页服务.发送信令到主页面板(信令)
                        }) 
                },
                "主页信令.设置.插件切换主题" : ()=>{ 插件服务.执行指令("护眼主题.侧边栏.设置.切换主题")  },
                "主页信令.设置.打开配色文件" : ()=>{ 插件服务.执行指令("护眼主题.侧边栏.设置.配色文件")  }, 
                "主页信令.设置.打开插件设置" : ()=>{ 插件服务.执行指令("护眼主题.侧边栏.设置.打开设置")   }, 
                "主页信令.设置.刷新仓库" : ()=>{ 插件服务.执行指令("护眼主题.侧边栏.仓库.刷新")  }, 
                "主页信令.设置.配置Linux":()=>{ 插件服务.配置Linux() },
        }
        if( typeof(信令对应函数表[信令.类型]) === "function" ) {信令对应函数表[信令.类型]() }             
        else { console.log("🐛主页服务.主页_消息处理函数🐛护眼主题:未识别主页信令🔥："+ 信令.类型 ) }
    }
    

    侧边页服务.侧边栏网页_消息处理函数 = function(信令){    
        // 快捷键  Ctrl+k 再按 Ctrl+4  折叠所有信令
        const 信令对应函数表 = {                          // 信令映射表
            //网页加载后，即启动后，发来的信令
            //按钮事件发来的信令
            //文件树发来的信令
            //文件树右键菜单发来的信令
            //-----------------回应信令也这么命名---------------------------
  
            "启动.查询中英标点转换状态":()=>{
                if(标点转换服务.中转英标点转换开启){
                    侧边页服务.发送信令到侧边栏网页({类型:"插件信令.切换中英标点图表明亮度", 开关:标点转换服务.中转英标点转换开启})
                }else{
                    侧边页服务.发送信令到侧边栏网页({类型:"插件信令.切换中英标点图表明亮度", 开关:标点转换服务.中转英标点转换开启})
                }

            },
            "启动.查询文件树目录":()=>{
                if(仓库服务.启用仓库功能){
                    插件服务.读取本地文件(全局_配置对象.配置文件路径)
                        .then((配置对象)=>{
                            全局_配置对象=配置对象
                            侧边页服务.根目录标记仓库后_发送给侧边栏网页( 全局_配置对象  , "侧边页启动");
                        })
                        .catch(()=>{
                            console.log('🐛启动.查询文件树目录🐛护眼主题：本地没有配置文件'+ 全局_配置对象.配置文件路径)
                        })
                }  
                侧边页服务.发送信令到侧边栏网页( {类型:"插件信令.开关文件树显示", 启用: 仓库服务.启用仓库功能 })
            }, 
            "启动.查询显示悬浮动画":  ()=>{ 
                侧边页服务.发送信令到侧边栏网页(  {类型: "插件信令.开关宇航员动画"  , 动画类型: 插件服务.获取用户定义值("护眼主题.侧边栏动画🚀")  } ) 
            },



            "按钮.打开欢迎主页":()=>{
                主页服务.显示主页()
            },
            "按钮.重启护眼主题插件":()=>{
                插件服务.插件重启()
            },
            '按钮.打开一个系统终端':()=>{
                插件服务.打开系统终端界面(os.homedir())
            },
            "按钮.配置Linux":()=>{
                插件服务.配置Linux()
            },
            "按钮.shell指令图标鼠标悬浮":()=>{
                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: 插件服务.获取用户定义值("护眼主题.shell指令🐠") })
            },
            "按钮.中英符号转换图标鼠标悬浮": ()=>{
                if(插件服务.获取用户定义值("护眼主题.中英标点转换🍺")){
                    侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "标点转换已开🍺"} )
                }else{
                    侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "标点转换已关🧊"})
                }
            },
            "按钮.开关中英标点转换" : ()=>{  插件服务.执行指令("护眼主题.中英标点转换") },  
            "按钮.打开插件设置" :     ()=>{    插件服务.执行指令("护眼主题.侧边栏.设置.打开设置")  },    
            "按钮.插件切换主题" :     ()=>{    插件服务.执行指令("护眼主题.侧边栏.设置.切换主题")  }, 
            "按钮.打开说明页" :       ()=>{    插件服务.执行指令("护眼主题.侧边栏.设置.插件说明")  }, 
            "按钮.打开配色文件" :     ()=>{    插件服务.执行指令("护眼主题.侧边栏.设置.配色文件")  }, 
            "按钮.打开插件目录" :     ()=>{    插件服务.执行指令("护眼主题.侧边栏.设置.插件目录")  }, 
            "按钮.刷新仓库" :         ()=>{      插件服务.执行指令("护眼主题.侧边栏.仓库.刷新")      }, 
            "按钮.执行shell指令" :    ()=>{     插件服务.执行指令("护眼主题.侧边栏.仓库.shell指令") }, 
            "按钮.打开shell指令配置页面":()=>{   插件服务.打开插件某项设置("打开shell指令配置页面") }, 
            "按钮.打开gitee令牌配置页面":()=>{  插件服务.打开插件某项设置("gitee仓库令牌为空") }, 
            "按钮.打开本地仓库目录" : ()=>{ 
                插件服务.本地路径是否存在(全局_配置对象.仓库本地路径)
                    .then(()=>{
                        插件服务.用系统默认应用打开(全局_配置对象.仓库本地路径)
                    })
                    .catch((错误)=>{
                        插件服务.创建新文件(全局_配置对象.仓库本地路径 , "文件夹")
                            .then(()=>{
                                插件服务.用系统默认应用打开(全局_配置对象.仓库本地路径)
                            })
                            .catch(()=>{
                                vscode.window.showErrorMessage("护眼主题：无法创建本地文件夹" + 仓库本地路径,"知道了")  
                                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: "无法创建总目录！ "}) 
                            })
                    })     
            },



            "文件树.标题.打开窗口选择本地根目录":()=>{
                侧边页服务.打开窗口选择本地根目录_发送给侧边栏网页(全局_配置对象)
            },
            "文件树.点击.用户点击文件树":()=>{   
                //这个是打开查询文件夹里的内容，刷新网页显示
                if(信令.用户操作 === "打开文件夹"){
                    侧边页服务.查询文件夹内容_发送给侧边栏网页(全局_配置对象, 信令.文件项.路径)
 
                }else if(信令.用户操作 === "关闭文件夹"){     //将文件关闭状态 写入
                    //console.log("📒文件树.点击.用户点击文件树📒护眼主题: 关闭文件夹" + 信令.文件项.路径)
                    侧边页服务.遍历目录写入子文件数组(全局_配置对象.根目录数组 ,  信令.文件项.路径 , false , [] )
                    //插件服务.保存配置到电脑(全局_配置对象)
                }
            },
            "文件树.点击.打开本地文件":()=>{          
                插件服务.打开文件(信令.文件项.路径)
            },


            "文件树.菜单.打开文件夹":()=>{       
                let 文件夹路径 =  信令.文件项.路径
                插件服务.本地路径是否存在(文件夹路径)
                    .then((文件类型)=>{
                        if(文件类型 === "文件夹"){
                            插件服务.用系统默认应用打开(文件夹路径)              //是目录就打开
                        }else if(文件类型 === "文件"){
                            插件服务.用系统默认应用打开(  path.dirname(文件夹路径)  )  //是文件打开父文件夹
                        }
                    })
            }, 
            "文件树.菜单.打开终端界面":()=>{   
                let 路径 = 信令.文件项.路径
                if(信令.文件项.类型==="文件")  路径= path.dirname(信令.文件项.路径)
                
                let 终端 = 插件服务.生成终端界面("护眼主题", 路径, "欢迎  "+信令.文件项.文件名)
                终端.show()
                插件服务.延时后执行(1000)
                    .then(()=>{
                        if(os.type() !== "Linux"){
                            终端.sendText("此系统非 Linux !!!")
                            return
                        }  
                        终端.sendText("ls")
                    })  

 
            },
            "文件树.菜单.编辑文件项目" :()=>{            
                插件服务.执行指令('vscode.openFolder', vscode.Uri.file(信令.文件项.路径), true)
            },

            "文件树.菜单.http静态文件服务器":()=>{          
                
                插件服务.创建http静态文件服务器("127.0.0.1", 7000 , 信令.文件项.路径)
                    .then(访问网址 =>{
                        插件服务.用系统默认应用打开(访问网址)
                    })
            },
            '文件树.菜单.文件相关打开操作':()=>{
                switch(信令.操作类型){
                    case '播放视频':
                        插件服务.用系统默认应用打开(信令.文件项.路径)
                        break
                    case '合并多段视频':
                        let 指令路径 = path.join(插件服务.插件路径, "Linux脚本","入口.sh")
                        插件服务.打开系统终端界面执行( path.dirname(信令.文件项.路径) , 指令路径  +" "+ "合并")
                        break
                    case '浏览器打开html':
                        插件服务.用系统默认应用打开(信令.文件项.路径)
                        break
                    case '运行sh脚本':
                        插件服务.打开系统终端界面执行( path.dirname(信令.文件项.路径) , 信令.文件项.路径)
                        break
                    case '预览md文件':
                        插件服务.预览md文件(信令.文件项.路径)
                        break
                    default:
                }
            },
            "文件树.菜单.关闭此目录":()=>{
                全局_配置对象.根目录数组 = 全局_配置对象.根目录数组.filter(项 => 项.路径 != 信令.文件项.路径) //去掉旧的
                //侧边页服务.存储根目录数据到本地()   //修改了 需要重新存储
                //插件服务.保存配置到电脑(全局_配置对象)
                侧边页服务.发送信令到侧边栏网页({类型:"插件信令.更新显示文件树", 目录数组: 全局_配置对象.根目录数组})
            },
            "文件树.菜单.打开项目主页":()=>{
                if(信令.文件项.gitee仓库){
                    插件服务.用系统默认应用打开(信令.文件项.gitee仓库.html_url); 
                }else{
                    let 文件路径 = 信令.文件项.路径
                    //存在.git/index文件
                    let git文档路径 = path.join(文件路径, ".git", "index")  
                    插件服务.本地路径是否存在(git文档路径)
                        .then(()=>{
                                //这个文件夹是 git 仓库
                                let 查询指令 = "cd   "+文件路径+ "  ;  git remote -v"     
                                插件服务.执行shell指令(查询指令, (错误, stdout,stderr)=>{
                                    // 正则测试地址 https://c.runoob.com/front-end/854/  
                                    let 网页地址数组 = /https:\/\/[^\s]*/g.exec(stdout)  //查找网址
                                    if(网页地址数组 === null || 网页地址数组.length === 0) {   

                                            //linux 下 git@gitee.com:lwleen/vs (fetch)
                                            let 仓库数组 = /(?<=:)[^\s]+/g.exec(stdout)    //查找 lwleen/vs
                                            if(仓库数组 === null || 仓库数组.length === 0) { 
                                                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "此目录不是仓库 或 未安装 git软件"})
                                            }else{
                                                插件服务.用系统默认应用打开("https://gitee.com/"+仓库数组[0])
                                            }
                                    }
                                    else 插件服务.用系统默认应用打开(网页地址数组[0])
                                    })
                        })
                        .catch((错误)=>{
                                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "此目录不是仓库"})
                            })
                }
            },


            "文件树.菜单.推送仓库":()=>{  
                let 文件路径 = 信令.文件项.路径
                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "正在推送仓库 ..." })
                //存在.git/index文件
                let git文档路径 = path.join(文件路径, ".git", "index")  
                插件服务.本地路径是否存在(git文档路径)
                   .then(()=>{
                        //这个文件夹是 git 仓库
                        let 推送指令 = "cd   "+文件路径+ "  ; git add . ; git commit -m $(date +%Y.%m); git push origin master"
   
                        //用户选中推送
                        插件服务.执行shell指令(推送指令 ,(错误, stdout,stderr)=>{
                            if(错误) {
                                vscode.window.showErrorMessage("护眼主题：推送仓库发送错误！！！请确认是否正确的配置了 git 软件。" , "知道了")  
                                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "仓库推送失败！"} )
                                侧边页服务.发送信令到侧边栏网页({类型:"文件树.菜单.推送仓库操作完成",文件项: 信令.文件项, 显示文本: 错误})
                            }
                            else {
                            //成功推送
                                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "仓库推送成功！"} )
                               // vscode.window.showInformationMessage("护眼主题：推送仓库 \n " + stdout + stderr , "知道了")
                               侧边页服务.发送信令到侧边栏网页({类型:"文件树.菜单.推送仓库操作完成",文件项: 信令.文件项, 显示文本: stdout +'\n'+ stderr})
                            }
                            
                        })
                    })
                    .catch((错误)=>{
                        侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "此目录不是仓库"} )
                        侧边页服务.发送信令到侧边栏网页({类型:"文件树.菜单.推送仓库操作完成", 文件项: 信令.文件项,显示文本:错误})
                    })

            },            
            "文件树.菜单.下载仓库" : ()=>{           
                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本",文本: "正在下载仓库 ..."} )
                let 仓库项= 信令.文件项.gitee仓库
                let 最终路径 = path.join(全局_配置对象.仓库本地路径 , 仓库项.path )

                插件服务.本地路径是否存在(最终路径)
                     .then(()=>{
                        侧边页服务.发送信令到侧边栏网页({类型:"文件树.菜单.无法下载仓库", 文件项:信令.文件项 }) 
                        侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本:  "仓库文件夹已存在！"} );
                     })
                     .catch((错误)=>{  //不存在时下载
                        插件服务.执行shell指令("git version", (不存在git)=>{   
                            if(不存在git){ 
                                侧边页服务.发送信令到侧边栏网页({类型:"文件树.菜单.无法下载仓库", 文件项:信令.文件项 })
                                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "未安装 git 软件"} )
                                vscode.window.showErrorMessage("护眼主题：此电脑未安装 git 软件！下载网址： https://git-scm.com/ " , "知道了")
                            }
                            else{
                                let 下载地址 = path.join(全局_配置对象.仓库本地路径 ,仓库项.path)
                                插件服务.用git克隆仓库(仓库项, 下载地址, (下载出错 ) => {
                                    if(下载出错) {
                                        vscode.window.showErrorMessage("护眼主题：下载仓库出现异常，请确认地址是否正确。"+ 下载出错 , "知道了")
                                        侧边页服务.发送信令到侧边栏网页({类型:"文件树.菜单.无法下载仓库", 文件项:信令.文件项 })
                                        侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本:  "无法下载仓库！"} )
                                    }
                                    else{  
                                        侧边页服务.根目录标记仓库后_发送给侧边栏网页( 全局_配置对象 ,'下载仓库' );
                                        侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本:  "成功下载仓库"} )
                                    }
                                })
                            }
                        })
                     })
            },                                                            

            "文件树.菜单.删除本地仓库文件":()=>{    
                    let 路径=信令.文件项.路径
                    插件服务.删除文件(路径)
                        .then(()=>{
                            侧边页服务.根目录标记仓库后_发送给侧边栏网页( 全局_配置对象, '删除本地仓库' );
                        })
                        .catch((错误)=>{
                            vscode.window.showErrorMessage("护眼主题：无法删除文件夹！！！"+ 错误,"知道了")
                            侧边页服务.发送信令到侧边栏网页({类型:"文件树.菜单.删除仓库失败", 文件项:信令.文件项})
                        })
                         
            },
     
            "文件树.菜单.重命名":()=>{            // 信令格式   {类型:"重命名文件" , 文件项:文件项 , 新路径: 新路径}
                    
                    let 旧路径=信令.文件项.路径
                    let 新路径=path.join( path.dirname(信令.文件项.路径), 信令.新文件名 )

                    插件服务.重命名文件(旧路径, 新路径)
                        .then(()=>{

                            if(["文件","文件夹"].includes(信令.文件项.类型)){
                                侧边页服务.查询文件夹内容_发送给侧边栏网页(全局_配置对象,  path.dirname(旧路径)) 
                            }else if(信令.文件项.类型 === "文件根目录"){
                                let 成员序号 = 全局_配置对象.根目录数组.findIndex(项 => 项.路径 === 旧路径)  
                                全局_配置对象.根目录数组[成员序号].路径=新路径
                                全局_配置对象.根目录数组[成员序号].文件名 = path.basename(新路径)
                            
                                //修改子
                                全局_配置对象.根目录数组[成员序号].子文件数组.forEach(文件项=>{
                                    文件项.父路径= 新路径
                                    文件项.路径=path.join(新路径 , 文件项.文件名)
                                })

                                侧边页服务.发送信令到侧边栏网页({类型:"插件信令.更新显示文件树", 目录数组: 全局_配置对象.根目录数组})
                            }
                        })
                        .catch(()=>{
                            console.log("🐛文件树.菜单.重命名🐛无法修改文件名 " ,信令.新路径 )
                        //    侧边页服务.查询文件夹内容_发送给侧边栏网页(全局_配置对象, path.dirname(信令.文件项.路径)) 
                            侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: "错误：无法修改文件名！"} )
                        })
  
            },
            "文件树.菜单.新建文件":()=>{     
                let 新文件路径=path.join(信令.新文件项.父路径, 信令.新文件项.文件名)
                插件服务.本地路径是否存在(新文件路径)
                    .then(()=>{
                        侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: "文件已经存在！"} ) 
                    })
                    .catch(()=>{
                        插件服务.创建新文件(新文件路径, 信令.新文件项.类型)
                            .then(()=>{
                                侧边页服务.查询文件夹内容_发送给侧边栏网页(全局_配置对象,  path.dirname(新文件路径)) 
                            })
                            .catch(()=>{
                                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: "错误：无法创建新文件！"} )
                            })
                    })
            },
            "文件树.菜单.删除文件":()=>{        
                    插件服务.删除文件(信令.文件项.路径)
                        .then(()=>{                            // 刷新父文件夹显示
                            侧边页服务.查询文件夹内容_发送给侧边栏网页(全局_配置对象,  path.dirname( 信令.文件项.路径 )  )
                        })
                        .catch((错误)=>{
                            vscode.window.showErrorMessage("护眼主题：无法删除文件！！！"+ 错误,"知道了")
                            侧边页服务.发送信令到侧边栏网页({类型:"文件树.菜单.删除文件失败", 文件项:信令.文件项 })
                        })
               
            },  
            
        }  
        if( typeof(信令对应函数表[信令.类型]) === "function" ) {
                信令对应函数表[信令.类型]()                  //调用映射函数
             //   console.log("护眼主题:网页信令💧  " + 消息.类型)
        }else { console.log("🐛侧边页服务.侧边栏网页_消息处理函数🐛护眼主题:未识别网页信令🔥："+ 信令.类型 ) }
    }
   
    // 快捷键  Ctrl+k 再按 Ctrl+3  折叠所有指令
    const 指令对应函数表 = {
        "护眼主题.快捷键_重启护眼主题插件" : ()=>{  
            插件服务.插件重启()    //当屏幕聚焦到 护眼主题侧边栏时， 可以用快捷键 ctrl+ f12 重启护眼主题插件
         },
        "护眼主题.后退跳转" : ()=>{ 插件服务.执行指令("workbench.action.navigateBack") },
    
        //仓库指令====================================================
        "护眼主题.侧边栏.仓库.刷新": ()=>{
            if(!仓库服务.启用仓库功能){
                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "未打开仓库功能开关"} )
                插件服务.打开插件某项设置("未打开仓库功能开关")
                return
            }  

            侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本", 文本: "正在刷新仓库 ..."} )
            令牌 =  插件服务.获取用户定义值("护眼主题.gitee仓库令牌")
            //仓库服务.获得gitee用户资料(令牌)   
            if(令牌 === "") {
                插件服务.打开插件某项设置("gitee仓库令牌为空");
                侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "请输入gitee仓库令牌"} )
                return
            } 
            仓库服务.获得所有仓库目录(令牌, "pushed")   // pushed 按推送顺序  是返回的目录 排序类型
                    //如果出现异常, 下面的 .then 不会执行
                    .then((仓库数据)=>{   
                            //仓库服务.存储仓库数据到本地(仓库数据)    
                            全局_配置对象.所有仓库 = 仓库数据
                            
                            侧边页服务.根目录标记仓库后_发送给侧边栏网页( 全局_配置对象 ,"刷新仓库");
                            侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" , 文本: "刷新完成"} )

                            插件服务.本地路径是否存在(全局_配置对象.仓库本地路径)
                                .catch((错误)=>{
                                    插件服务.创建新文件(全局_配置对象.仓库本地路径, "文件夹")
                                })
                        })
        },
        "护眼主题.侧边栏.仓库.shell指令": ()=>{ 
            侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本:  "Shell 指令在运行..."} )

            let 指令 = 插件服务.获取用户定义值("护眼主题.shell指令🐠")   //用户发来的指令 或者是预设的信令

            let 信令对应函数表 = {
                "":()=>{
                    侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: "Shell 指令未定义！"} )  ;
                    插件服务.打开插件某项设置("Shell 指令未定义！")
                },

                "保存仓库":()=>{
                    let 当前主机用户信息 = os.userInfo({ encoding: 'utf-8' })
                    console.log("📒护眼主题.侧边栏.仓库.shell指令📒护眼主题：当前用户  "+ 当前主机用户信息.username)
                    if(当前主机用户信息.username === "lwl" || 当前主机用户信息.username === "lwlee" ) {
                        侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: "欢迎 "+ 当前主机用户信息.username} )
                    }
                    else{
                        侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: "此为保留指令"} )
                        return;      //此为保留指令
                    } 

                    let 执行暂存 ="cd  "+插件服务.插件路径+ " ; git add . ;  git commit -m $(date +%Y.%m) "
                    插件服务.执行shell指令(执行暂存, (err, stdout, stderr)=>{
                    // if(stderr) vscode.window.showErrorMessage("护眼主题：指令错误，请检查是否正确","知道了")
                        侧边页服务.发送信令到侧边栏网页({类型:"插件信令.弹出文本框显示信息" ,标题:"保存代码：", 文本:stdout + stderr })
                    //  vscode.window.showInformationMessage(stdout   ,"知道了" )
                        侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: "指令执行完成"} )
                    }) 
                },
                "打开仓库总目录":()=>{
                    插件服务.用系统默认应用打开( 全局_配置对象.仓库本地路径 ) ;
                },
                "默认":()=>{  // 其余情况，当中代码指令处理
                    if(指令 === "默认") return;
                    插件服务.执行shell指令(指令, (err, stdout, stderr)=>{
                        if(err) vscode.window.showErrorMessage("护眼主题：指令错误，请检查是否正确","知道了")
                        侧边页服务.发送信令到侧边栏网页({类型:"插件信令.弹出文本框显示信息" ,标题:"终端输出：", 文本:stdout + stderr })
                    //    vscode.window.showInformationMessage(stdout ,"知道了")
                        侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: "指令执行完成"} )
                    }) 
                }
            }
            if( typeof(信令对应函数表[指令]) === "function" ) {
                    信令对应函数表[指令]()                    //调用映射函数
            }else   信令对应函数表["默认"]()                //其余情况全部当成代码指令处理

        },

        //设置指令=============================================
        "护眼主题.侧边栏.设置.切换主题":()=>{
                插件服务.切换主题();
        },
        "护眼主题.侧边栏.设置.插件目录":()=>{                           //打开目录
            插件服务.用系统默认应用打开(插件服务.插件路径)
        },
        "护眼主题.侧边栏.设置.配色文件":()=>{                    
            插件服务.选择后显示文件( path.join(插件服务.插件路径, "./themes" )  , "可自定义配色" ,"打开配色文件")
        },
        "护眼主题.侧边栏.设置.网页源码":()=>{                    
            插件服务.选择后显示文件( path.join(插件服务.插件路径, "./资源" ) , "欢迎主页的源码" ,"打开源码" )
        },
        "护眼主题.侧边栏.设置.打开设置":()=>{    
                插件服务.打开插件设置()
        },
        "护眼主题.侧边栏.设置.欢迎主页":()=>{
                let 网页面板 = 插件服务.打开网页("./资源/主页.html", 欢迎)
                插件服务.处理网页消息(网页面板, 消息 =>{                        //参数是 消息的处理函数
                                    switch(消息.text){        //发送来的格式 {text: '打开插件设置'}
                                        case "插件切换主题" : 插件服务.执行指令("护眼主题.侧边栏.设置.切换主题") ; break;
                                        case "打开配色文件" : 插件服务.执行指令("护眼主题.侧边栏.设置.配色文件") ; break;
                                        case "打开插件设置" : 插件服务.执行指令("护眼主题.侧边栏.设置.打开设置") ; break;
                                        case "网页面板点击" : 插件服务.执行指令("护眼主题.网页面板点击") ; break;
                                        case "刷新仓库" : 插件服务.执行指令("护眼主题.侧边栏.仓库.刷新") ; break;
                                        default:  ;
                                    }
                })
        },
        "护眼主题.侧边栏.设置.插件说明":()=>{  
            // "view/title": [
			// 	{
			// 		"command": "护眼主题.侧边栏.设置.插件说明",
			// 		"when": "view == 护眼主题.侧边栏.设置",
			// 		"group": "navigation@1"
			// 	}
			// ],
            let 说明文件地址 = path.join(插件服务.插件路径 , "./README.md" )
            插件服务.预览md文件(说明文件地址)
        },


        //通知指令  杂项指令=============================================
        "护眼主题.侧边栏.通知.删除" :()=>{    },

        "护眼主题.网页面板点击":()=>{
            侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: " 喵~ "} )
        },

        "护眼主题.中英标点转换":()=>{         //切换交替开关      
            if(插件服务.获取用户定义值("护眼主题.中英标点转换🍺")){
                插件服务.生效配置("护眼主题.中英标点转换🍺", false, true)
            }
            else {
                插件服务.生效配置("护眼主题.中英标点转换🍺", true, true) 
            }
        }
    }
    插件服务.注册指令表( 指令对应函数表 );
  

    // 快捷键  Ctrl+k 在按 Ctrl+3  折叠所有配置
    const 配置存储表={
        "护眼主题.配置总开关🦄":{
            值:null,
            应用配置:( 新值 )=>{
                
            }
        },
        "护眼主题.中英标点转换🍺": {
            值:null,
            应用配置:( 新值 )=>{      //值变化时才会执行
                标点转换服务.开关中英标点转换( 新值 ) //打开或关闭转换
            }
        },  
        '护眼主题.启动时显示侧边视图':{
            值:null,
            应用配置:( 新值 )=>{      //值变化时才会执行
                if(新值) 插件服务.打开此插件侧边栏view视图()
            }
        }, 
        "护眼主题.仓库功能开关🐋":{
            值:null,
            应用配置:( 新值 )=>{      //是否已经读取
                if(新值 && 仓库服务.启用仓库功能 !== null) {  // 插件启动时为null  避免启动第一次
                    插件服务.读取本地文件(全局_配置对象.配置文件路径)
                        .then((配置文件对象)=>{
                            全局_配置对象=配置文件对象
                            //侧边页服务.发送信令到侧边栏网页({类型:"插件信令.更新显示文件树", 目录数组: 全局_配置对象.根目录数组})
                            侧边页服务.根目录标记仓库后_发送给侧边栏网页( 全局_配置对象 );
                        })
                        .catch(()=>{
                            console.log('🐛护眼主题.仓库功能开关🐋🐛护眼主题：本地没有配置文件'+ 全局_配置对象.配置文件路径)
                        })
                }
                仓库服务.启用仓库功能 = 新值   //保存
                侧边页服务.发送信令到侧边栏网页( {类型:"插件信令.开关文件树显示", 启用: 仓库服务.启用仓库功能 })
            }
        },
        "护眼主题.gitee仓库令牌":{
            值:null,
            应用配置:( 新值 )=>{}
        },
        "护眼主题.shell指令🐠":{
            值:null,
            应用配置:( 新值 )=>{}
        },
        "护眼主题.启用连字":{
            值:null,
            应用配置:( 新值 )=>{
                插件服务.生效配置( "editor.fontLigatures"  ,  新值, true)
            }
        },
        "护眼主题.字号大小":{
            值:null,   //默认是15号
            应用配置:( 新值 )=>{
                if(新值 > 0 ) 插件服务.生效配置( "editor.fontSize"  , 新值, true)
            }
        },
        "护眼主题.字体":{
            值:null,
            应用配置:( 新值 )=>{
                if( 新值 ) 插件服务.生效配置( "editor.fontFamily" , 新值, true)
            }
        },
        "护眼主题.unicode字符提示":{
            值:null,
            应用配置:( 新值 )=>{
                let 布尔查询表 = { "开启": true,  "关闭": false }
                插件服务.生效配置( "editor.unicodeHighlight.ambiguousCharacters",布尔查询表[新值], true); 
            }
        },
        "护眼主题.方括号嵌套着色":{
            值:null,
            应用配置:( 新值 )=>{
                插件服务.生效配置( "editor.bracketPairColorization.independentColorPoolPerBracketType" ,新值, true)
            }
        },
        "护眼主题.括号嵌套着色":{
            值:null,
            应用配置:( 新值 )=>{
                插件服务.生效配置( "editor.bracketPairColorization.enabled" ,新值, true)
            }
        },
        "护眼主题.布局小图标":{
            值:null,
            应用配置:( 新值 )=>{
                插件服务.生效配置( "workbench.layoutControl.type" ,新值, true)
            }
        },
        "护眼主题.窗口标题栏":{
            值:null,
            应用配置:( 新值 )=>{
                插件服务.生效配置( "window.titleBarStyle" , 新值, true)
            }
        },
        "护眼主题.迷你地图滑块":{
            值:null,
            应用配置:( 新值 )=>{
                插件服务.生效配置( "editor.minimap.showSlider" , 新值, true)
            }
        },
        "护眼主题.文件信任":{
            值:null,
            应用配置:( 新值 )=>{
                let 布尔查询表 = { "开启": true,  "关闭": false }
                if( 新值 !== "不关心") 插件服务.生效配置( "security.workspace.trust.enabled",布尔查询表[新值], true); 
            }
        },
        "护眼主题.侧边栏动画🚀":{
            值:null,
            应用配置:( 新值 )=>{
                侧边页服务.发送信令到侧边栏网页(  {类型: "插件信令.开关宇航员动画"  , 动画类型: 新值 } ) 
            }
        },
        "护眼主题.查看配置文件📙":{
            值:null,
            应用配置:( 新值 )=>{}
        },
    }
    function 配置变化事件(){
        //配置变化事件 ===================================================
        if ( 插件服务.获取用户定义值("护眼主题.配置总开关🦄") ){             // 只有开启此项, 才会优化一些配置

            let 配置名数组 = Object.getOwnPropertyNames(配置存储表)    //配置名 数组
            配置名数组.forEach( 配置名 =>{ 
                if(配置存储表[配置名].值 !== 插件服务.获取用户定义值(配置名)){     //配置发生变化的项

                    配置存储表[配置名].值 = 插件服务.获取用户定义值(配置名)        //更新值
                    if(typeof(配置存储表[配置名].应用配置) === "function"){
                        配置存储表[配置名].应用配置( 配置存储表[配置名].值 )      //调用处理函数处理此配置
                        侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: "已应用配置" } )
                    }
                }
            })

        }else  {
            侧边页服务.发送信令到侧边栏网页({类型: "插件信令.通知区显示文本" ,文本: "未打开配置总开关" } )
        }    
    }
    插件服务.注册配置变化事件( 配置变化事件 )

    配置变化事件();  //启动插件是要触发一次，更新配置存储表

    console.log("📒运行插件📒护眼主题：插件启动完成 🎉🎉🎉\n")

    // let 中文代码快速补全_插件 = vscode.extensions.getExtension("codeinchinese.chineseinputassistant")  
    // if(中文代码快速补全_插件 ===undefined && os.type() === "Linux" ){
    //     插件服务.执行shell指令("code --install-extension   codeinchinese.chineseinputassistant")
    //     插件服务.执行指令("workbench.view.extensions")  //打开插件视图
    //     vscode.window.showInformationMessage("正在安装插件： 中文代码快速补全","知道了")
    // }

    let 简体中文语言_插件 = vscode.extensions.getExtension("ms-ceintl.vscode-language-pack-zh-hans")
    if(简体中文语言_插件 ===undefined && os.type() === "Linux"){
        插件服务.执行shell指令("code --install-extension   ms-ceintl.vscode-language-pack-zh-hans")
        插件服务.执行指令("workbench.view.extensions")
        vscode.window.showInformationMessage("正在安装插件： 简体中文语言","知道了")
    }
 
}
 


function 退出插件(context){   //插件被释放时触发   vscode 关闭时，也会执行到这里

    //this.保存配置到电脑(全局配置对象)
    if(全局_配置对象.所有仓库.length !==0){  //避免写入空白数据
        fs.writeFileSync(  全局_配置对象.配置文件路径 ,   JSON.stringify(全局_配置对象 , null, 2 )   )
    }
    
}


/*  


module.exports = {
    activate,         //激活插件时，执行的代码子程序
    deactivate        //插件释放时，执行的代码子程序
}
function deactivate() {}   //释放时 销毁终端 

*/


         /*       "推送":()=>{
                    let 执行推送 ="cd  "+插件服务.插件路径+ " ; git add . ; git commit -m $(date +%Y.%m); git push origin master"
                    插件服务.执行shell指令(执行推送, (err, stdout, stderr)=>{
                        if(err) vscode.window.showErrorMessage("护眼主题：指令错误，请检查是否正确","知道了")
                        网页服务.发送信令到侧边栏网页("插件信令.自用git推送" ,stdout + stderr )
                    //  vscode.window.showInformationMessage(stdout   ,"知道了" )
                        网页服务.发送信令到侧边栏网页("插件信令.通知区显示文本" ,"指令执行完成")
                    }) 
                },   */


 /*
    插件服务.注册指令("护眼主题.侧边栏.仓库.点击仓库", 仓库名称 =>{  //重要！！！参数 [仓库名称] 来源 -> createTreeView 创建侧边栏是定义的此回调函数的参数 
            let 选中仓库 = 仓库服务.查找仓库(仓库名称) 
            if(选中仓库.存在 === "存在")   网页服务.发送信令到侧边栏网页("通知" , "仓库已下载")   
            else     网页服务.发送信令到侧边栏网页("通知" , "仓库未下载 ")   
    })
    插件服务.注册指令("护眼主题.侧边栏.仓库.下载仓库", 条目对象=>{   //条目对象.label 就是显示的标签内容
            网页服务.发送信令到侧边栏网页("显示","正在下载仓库 ...")
            let 选中仓库 = 仓库服务.查找仓库(条目对象.label)
            let 最终路径 = path.join(仓库服务.仓库本地路径 , 选中仓库.path )
            console.log(最终路径)
            fs.access(最终路径 ,(错误)=>{
                if(错误){ 
                    child_process.exec("git version", (错误)=>{
                        if(错误){ 
                            网页服务.发送信令到侧边栏网页("通知" , "未安装 git 软件")
                            vscode.window.showErrorMessage("护眼主题：此电脑未安装 git 软件！下载网址： https://git-scm.com/ " , "知道了")
                        }
                        else{
                            let 下载地址 = path.join(仓库服务.仓库本地路径 ,选中仓库.path)
                            插件服务.执行shell指令("git clone "+ 消息.仓库.html_url + " " +下载地址,  错误 => {
                                   if(错误) vscode.window.showErrorMessage("护眼主题：下载仓库出现异常 "+ 错误 , "知道了")
                             })
                        }
                    })
                }  
                else {  网页服务.发送信令到侧边栏网页("通知" , "仓库无需重复下载");return }
            }) 
    })
    插件服务.注册指令("护眼主题.侧边栏.仓库.vscode打开仓库", 条目对象=>{

            let 选中仓库 = 仓库服务.查找仓库(条目对象.label)
            let 路径 =  path.join(仓库服务.仓库本地路径, 选中仓库.path )  //合成地址
            插件服务.执行指令('vscode.openFolder', vscode.Uri.file(路径), true)
    })
    插件服务.注册指令("护眼主题.侧边栏.仓库.文件浏览器打开仓库", 条目对象=>{
            let 选中仓库 = 仓库服务.查找仓库(条目对象.label)
            let 路径 =  path.join(仓库服务.仓库本地路径, 选中仓库.path )  //合成地址
            插件服务.打开文件夹(路径)
    })
    插件服务.注册指令("护眼主题.侧边栏.仓库.网页打开仓库", 条目对象=>{
            let 选中仓库 = 仓库服务.查找仓库(条目对象.label)
            插件服务.浏览器打开网页(选中仓库.html_url)
    })
    */

 /*
    var 侧边栏_我的通知 =  new 护眼主题侧边栏服务(context,'护眼主题.侧边栏.通知')
    侧边栏_通知数据 =[  
        { 显示文本: "打开设置" , 指令: "护眼主题.侧边栏.设置.打开设置", 图标地址:{light:"./资源/图标/1设置.png" ,dark:"./资源/图标/反色/1-1设置.png"}  },                                           
        { 显示文本: "切换主题" , 指令: "护眼主题.侧边栏.设置.切换主题", 图标地址:{light:"./资源/图标/2刷新.png" ,dark:"./资源/图标/反色/1-2刷新.png"}  },
        { 显示文本: "插件目录" , 指令: "护眼主题.侧边栏.设置.插件目录", 图标地址:{light: "./资源/图标/3文件夹.png" ,dark:"./资源/图标/反色/1-3文件夹.png"} },
        { 显示文本: "配色文件" , 指令: "护眼主题.侧边栏.设置.配色文件", 图标地址:{light:"./资源/图标/4文本.png" ,dark:"./资源/图标/反色/1-4文本.png"}    },
        { 显示文本: "————", 指令: "",图标地址:{}},
        { 显示文本: "网页源码" , 指令: "护眼主题.侧边栏.设置.网页源码", 图标地址:{light:"./资源/图标/5网络.png" ,dark:"./资源/图标/反色/1-5网络.png"} },
        { 显示文本: "欢迎主页" , 指令: "护眼主题.侧边栏.设置.欢迎主页", 图标地址:{light:"./资源/图标/6首页.png" ,dark:"./资源/图标/反色/1-6首页.png"} },
     ];
       侧边栏_我的通知.数据显示(侧边栏_通知数据)  


    //侧边栏显示文本=================================================


    var 侧边栏_我的设置 = new 护眼主题侧边栏服务(context,'护眼主题.侧边栏.设置') 
    var 侧边栏_设置显示数据 =[  
        { 显示文本: "打开设置" , 指令: "护眼主题.侧边栏.设置.打开设置", 图标地址:{light:"./资源/图标/1设置.png" ,dark:"./资源/图标/反色/1-1设置.png"}  },                                           
        { 显示文本: "切换主题" , 指令: "护眼主题.侧边栏.设置.切换主题", 图标地址:{light:"./资源/图标/2刷新.png" ,dark:"./资源/图标/反色/1-2刷新.png"}  },
        { 显示文本: "插件目录" , 指令: "护眼主题.侧边栏.设置.插件目录", 图标地址:{light: "./资源/图标/3文件夹.png" ,dark:"./资源/图标/反色/1-3文件夹.png"} },
        { 显示文本: "配色文件" , 指令: "护眼主题.侧边栏.设置.配色文件", 图标地址:{light:"./资源/图标/4文本.png" ,dark:"./资源/图标/反色/1-4文本.png"}    },
        { 显示文本: "————", 指令: "",图标地址:{}},
        { 显示文本: "网页源码" , 指令: "护眼主题.侧边栏.设置.网页源码", 图标地址:{light:"./资源/图标/5网络.png" ,dark:"./资源/图标/反色/1-5网络.png"} },
        { 显示文本: "欢迎主页" , 指令: "护眼主题.侧边栏.设置.欢迎主页", 图标地址:{light:"./资源/图标/6首页.png" ,dark:"./资源/图标/反色/1-6首页.png"} },
     ];
    侧边栏_我的设置.数据显示(侧边栏_设置显示数据)   

     var 侧边栏_我的仓库 =  new 护眼主题侧边栏服务(context,'护眼主题.侧边栏.仓库')
    var 侧边栏_仓库数据 = [  { 显示文本:"" , 指令: "", 图标地址:{}},  ]   //第一个被使用
    侧边栏_我的仓库.数据显示(侧边栏_仓库数据)



        function 仓库侧边栏刷新数据显示(){
       fs.readdir( 仓库服务.仓库本地路径 ,"utf-8", (错误, 文件数组=[] )=>{       //这里读取了HOME 目录
            //无论是否出错，都会执行到这里
            let 图标 ={}
                for(i=0;i< 仓库服务.所有仓库.length;i++){  // 我的有 14 个
                    if(仓库服务.所有仓库[i].public === true )
                            图标 = {light:"./资源/图标/17对号.png", dark:"./资源/图标/反色/1-17对号.png"}
                    else    图标 = {light:"./资源/图标/18锁.png", dark:"./资源/图标/反色/1-18锁.png"} 
                
                    侧边栏_仓库数据[i] ={
                        显示文本:仓库服务.所有仓库[i].name ,
                        指令: "护眼主题.侧边栏.仓库.点击仓库",
                        图标地址: 图标 }  

                    //判断 fs.readdir 读取的结果   
                    if(错误) {    // 这是没有文件夹，创建   //全部为空
                        fs.mkdir(仓库服务.仓库本地路径, ()=>{   })  
                        侧边栏_仓库数据[i].图标地址={} ; 
                    }    
                    else {                                                   //下面根据是否存在文件夹，显示图标  
                        let 存在 = 文件数组.filter( 项 => { if( 仓库服务.所有仓库[i].path  === 项)  return 项 }   )[0]   //筛选
                        if( 存在 )  { 仓库服务.所有仓库[i].存在 = "存在"  } 
                        else{
                            侧边栏_仓库数据[i].图标地址={} ; 
                            仓库服务.所有仓库[i].存在 = "不存在"   //标记仓库是否被下载
                        }                                
                    } 
                } 
        侧边栏_我的仓库.数据显示(侧边栏_仓库数据)              //显示侧边栏数据 
        })
    }

    function 启动时加载旧仓库数据(){
        let 数据路径 = path.join(插件服务.插件路径 , "./仓库数据.json" )
        fs.readFile(数据路径, (出错, 数据)=>{                       //读取插件目录里的 ./仓库文件.json
            if(出错){
                console.log("护眼主题：本地没有仓库文件")
            }else{
                let 仓库数据 = JSON.parse(数据)
                仓库服务.所有仓库 = 仓库数据
                仓库侧边栏刷新数据显示()
                console.log("护眼主题：读取了本地仓库文件" + 数据路径)
            }
        })     
    }
    启动时加载旧仓库数据() ;    // 插件启动时调用一次 显示之前保存的仓库信息



package.json

    "viewsContainers": {
			"activitybar": [
				{
					"id": "my_theme",
					"title": "护眼主题",
					"icon": "/资源/图标/0素描蓝鲸.png"
				}
			]
		},
    "views": {
			"my_theme": [
				{
					"type": "webview",
					"id": "护眼主题.侧边栏.设置",
					"name": "我的设置"
				},
				{
					"id": "护眼主题.侧边栏.仓库",
					"name": "我的仓库"
				},
				{
					"id": "护眼主题.侧边栏.通知",
					"name": "通知"
				}
			]
		},
		"menus": {
			"view/title": [
				{
					"command": "护眼主题.侧边栏.仓库.刷新",
					"when": "view == 护眼主题.侧边栏.仓库",
					"group": "navigation@1"
				},
				{
					"command": "护眼主题.侧边栏.设置.插件说明",
					"when": "view == 护眼主题.侧边栏.设置",
					"group": "navigation@1"
				}
			],
			"view/item/context": [
				{
					"command": "护眼主题.侧边栏.仓库.vscode打开仓库",
					"when": "view == 护眼主题.侧边栏.仓库",
					"group": "navigation@2"
				},
				{
					"command": "护眼主题.侧边栏.仓库.文件浏览器打开仓库",
					"when": "view == 护眼主题.侧边栏.仓库",
					"group": "navigation@3"
				},
				{
					"command": "护眼主题.侧边栏.仓库.网页打开仓库",
					"when": "view == 护眼主题.侧边栏.仓库",
					"group": "navigation@4"
				},
				{
					"command": "护眼主题.侧边栏.仓库.下载仓库",
					"when": "view == 护眼主题.侧边栏.仓库",
					"group": "navigation@5"
				}
			]
		},
    

*/      



