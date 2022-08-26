
const vscode = acquireVsCodeApi()    //api 接




class 网页服务类{
    constructor(){                //启动时执行
        this.记录点击执行shell指令图标时_鼠标位置 = {}
        this.文本框存在 = false
    }
    从id找到节点(id){ return document.getElementById(id)  }
  
    从classname找到节点数组(classname) { return document.getElementsByClassName(classname) }

    遍历对象(对象){
        return new Promise((成功后回调,失败后回调)=>{
            let 配置名数组 = Object.getOwnPropertyNames(对象) 
            成功后回调(配置名数组)
        })
    }

    生成随机6位字符串(){
        return Math.random().toString(36).slice(-6) 
    }
    初始化图标鼠标悬浮事件(){
        //图标上悬浮发生的事件 ================================================
        this.鼠标悬浮("设置图标id", "打开设置")
        this.鼠标悬浮("切换主题图标id", "切换主题")
        this.鼠标悬浮("主页图标id", "欢迎主页")
        //鼠标悬浮("说明页图标id", "标点转换💦")
        this.鼠标悬浮("配色文件图标id", "配色文件🌈")
        this.鼠标悬浮("插件目录图标id", "插件目录")
        this.鼠标悬浮("刷新仓库图标id", "刷新仓库")
        //鼠标悬浮("执行shell指令图标id", "运行Shell指令")
        this.鼠标悬浮("打开本地仓库目录id", "打开仓库目录")
        this.鼠标悬浮("打开配置页id", "打开配置页")

        this.元素("执行shell指令图标id").onmouseover =()=>{ //悬浮执行
            this.发送消息({类型:'侧边网页信令.shell指令图标鼠标悬浮'});   //插件信令.鼠标悬浮读取的shell指令
        }  
        // this.元素("中英符号转换图标id").onmouseover =()=>{ //悬浮执行
        //     this.发送消息({类型:'侧边网页信令.中英符号转换图标鼠标悬浮'});  //插件信令.鼠标悬浮读取的标点转换状态
        // }
 
    }
    文本框失去焦点后销毁(元素 , 时间){
        //  let 元素=document.getElementById(元素id)
            let 定时器 = setTimeout(()=>{
                if(this.文本框存在 === true){
                    this.文本框存在 = false
                    元素.parentNode.removeChild(元素)      //销毁
                } 
                clearTimeout(定时器)
            }, 时间 * 1000)
            元素.onfocus = ()=>{ clearTimeout(定时器) }
            元素.onmouseover = ()=>{ 元素.focus()}    
            元素.onblur = ()=>{  this.文本框失去焦点后销毁(元素 , 2) } //失去焦点后再次销毁
    }
    生成文本框(坐标位置 , 标题, 显示文本){
        if(this.文本框存在) return;
        this.文本框存在 =true

        let 随机id = this.生成随机6位字符串()
        let 文本框坐标 = {x:"10%"   ,y:  坐标位置.y -170 }   //相对浏览器窗口

        let 文本框 = document.createElement('div'); 
        文本框.id = "文本框"+随机id 
        文本框.className ="文本框"
        文本框.style.zIndex = 998
        文本框.style.position = "fixed"     //---重要-->生成绝对定位的元素，相对于浏览器窗口进行定位
        文本框.style.width = "190px"        //提示框大小
        文本框.style.height = "150px"  
        文本框.style.left = (文本框坐标.x).toString()      
        文本框.style.top =  (文本框坐标.y).toString() + "px"  // top left  左上角坐标位置 0 0

        文本框.innerHTML=`
                <div  style="margin-top: -40%;margin-left: 2%;color: #217993;">
                    <h4>${标题}</h4>  
                </div>
                <div   style="margin-top: -68%;margin-left: 2%;">
                    <p>${显示文本}</p>
                </div>
        ` ///* 设置子元素为相对定位，可让子元素不继承Alpha值 */    //<p style="margin: 5px 0 0 10px">${显示文本}</p>
        document.getElementsByTagName("body")[0].appendChild(文本框)          //整个页面的子元素
        this.文本框失去焦点后销毁( 文本框 , 2.5)

    }
    生成选择框(坐标位置, 标题 , 显示文本 ){
        return new Promise((成功后调用 , 失败后调用 )=>{
            let 随机id = this.生成随机6位字符串()
            let 选择框坐标 = {x:"10%" ,y: 坐标位置.y -100 }

            let 选择框 = document.createElement('div'); 
            选择框.id="选择框"+随机id
            选择框.className = '选择框'
            选择框.style.display = "block"
            选择框.style.zIndex = 998  
            选择框.style.overflow = "hidden"
            选择框.style.position = "fixed"     //生成绝对定位的元素，相对于浏览器窗口进行定位
            选择框.style.width = "80%"
            选择框.style.height = "120px"
            选择框.style.left = (选择框坐标.x).toString()
            选择框.style.top =  (选择框坐标.y).toString() + "px"   // top left  左上角坐标位置 0 0
            选择框.innerHTML=`
                <div class="" style="margin-top: -20px;margin-left: -10px;">
                    <h4 class="">${标题}</h4>  
                </div>
                <div class="" style="margin-top: -3px;margin-left: 0px;">
                    <p>${显示文本}</p>
                </div>
            ` 
            document.getElementsByTagName("body")[0].appendChild(选择框)          //整个页面的子元素

            let 确认按钮 = document.createElement('button'); 
            确认按钮.id="确认按钮"+ 随机id
            确认按钮.className = '按钮模型 按钮样式2' 
            确认按钮.style.marginLeft = "15%"

            确认按钮.innerHTML=`<span style="margin-left:-80%">确认</span>` 
            选择框.appendChild(确认按钮)         
            确认按钮.onclick= ()=>{   //点击此按钮
                选择框.parentNode.removeChild(选择框) 
                成功后调用(window.event)   //window.event  点击后，它就是鼠标事件
            }

            let 取消按钮 = document.createElement('button'); 
            取消按钮.id="取消按钮"+ 随机id
            取消按钮.className = '按钮模型 按钮样式1' 
            取消按钮.style.marginLeft = "5%"
            取消按钮.innerHTML=`<span style="margin-left:-80%">取消</span>` 
            选择框.appendChild(取消按钮)   
            取消按钮.onclick= ()=>{   //点击此按钮
                选择框.parentNode.removeChild(选择框) 
                失败后调用("取消")
            } 
        })
    }

    点击后获取鼠标位置(){       //只适合点击情况
        let 当前窗口事件 = window.event
        if(当前窗口事件.type !== undefined && 当前窗口事件.type !==null && 当前窗口事件.type ==="click"){
            return  {x: 当前窗口事件.x, y:当前窗口事件.y } ;
        }
    }
    鼠标悬浮(图标id, 文本){
        let 设置图标 = document.getElementById(图标id)
        设置图标.onmouseover = ()=>{  
                document.getElementById("通知区id").style.visibility="visible";
                document.getElementById("通知区id").innerHTML = 文本
         }
        设置图标.onmouseleave = ()=>{    // onmouseleave  onblur
              document.getElementById("通知区id").style.visibility="hidden";
        }
    }
    显示通知后消失(文本 ,时间){
        
            document.getElementById("通知区id").style.visibility="visible";
            document.getElementById("通知区id").innerHTML = 文本; 
            let 定时器 = setTimeout(() => {
                document.getElementById("通知区id").style.visibility="hidden";
                clearTimeout(定时器)
            }, 时间 * 1000);
    }
    元素( 元素id ){  return document.getElementById(元素id) }
    发送消息(消息){   vscode.postMessage(消息);   }
    移除网页元素(元素id){
       let 元素=this.元素(元素id)
       元素.parentNode.removeChild(元素);  // 父元素.removeChild( 子元素 )     
    }  
    条目选中效果(选中元素id, css样式classname){     //选中的那个高亮
        let 旧元素  = this.元素(this.菜单选中项元素id)
        if(旧元素)  旧元素.firstElementChild.className= "目录节点"   //旧元素存在的话恢复之前的
        this.菜单选中项元素id = 选中元素id
        this.元素(this.菜单选中项元素id).firstElementChild.className= css样式classname 
    }
    右键菜单销毁(菜单元素id){
        if( this.菜单存在 ) {
            this.移除网页元素(菜单元素id)  
            this.菜单存在 = false 
        } 
    }
    选择文件图标(文件项){
        const 文件类型图标表={
            "文件夹":"图标_文件夹",
            ".md": "图标_文件md",
            ".png": "图标_文件图片",
            ".jpg": "图标_文件图片",
            ".txt": "图标_文件txt",
            ".sh":  "图标_文件sh",
            ".bat": "图标_文件sh",
            ".html":  "图标_文件html",
            ".conf":  "图标_文件conf",
            ".json": "图标_文件json",
            ".js": "图标_文件js",
            ".ts": "图标_文件ts",
            ".cpp": "图标_文件cpp",
            ".c": "图标_文件c",
            ".py": "图标_文件py",
            "文件":"图标_文件"
        }
        if(文件项.类型=== "文件夹")  return 文件类型图标表["文件夹"]
        else{
            if( typeof(文件类型图标表[文件项.扩展名]) === 'string' )  return 文件类型图标表[文件项.扩展名];
            else  return  文件类型图标表["文件"];;
        }
    }
    菜单位置定位(菜单元素, 鼠标事件){    
        /*
        菜单必须有属性   菜单.style.position = "fixed"     //生成绝对定位的元素，相对于浏览器窗口进行定位
        鼠标事件.x.y 是相对于窗口左上角的坐标
        */
        let 距离 = 鼠标事件.y +  菜单元素.offsetHeight - window.innerHeight   //当前可见网页高
        if( 距离 <= 0)  距离 = 0  //补偿，菜单页面不超出窗口
        菜单元素.style.top = ( 鼠标事件.y -距离 ).toString() + "px"   

        距离 = 鼠标事件.x  +  菜单元素.offsetWidth  -  window.innerWidth 
        if( 距离 <= 0)  距离 = 0  //补偿，菜单页面不超出窗口
        菜单元素.style.left = (鼠标事件.x  -距离).toString()  + "px"  
    }
    清空文件夹网页显示(文件夹元素){  
        //只保留第一个元素， 也就是标题。 其他的是文件夹里的内容
        let 第一个元素 = 文件夹元素.firstElementChild   // 或 children[0] 也是第一个
        文件夹元素.innerHTML = ""
        文件夹元素.appendChild(第一个元素)
    }
    文本转html显示(文本){
        let 字符串 = String(文本);
        let 文本_处理换行符 = 字符串.replace( /[\n\r]/g , '<br>'); 
        return 文本_处理换行符.replace( /\s/g , '&nbsp;'  );
    }
    打开文本(event){
        var 打开文本按钮 = event.target;  //  相当于   document.getElementById("打开文本按钮")
        var 文本 = new FileReader();
        文本.readAsText(打开文本按钮.files[0]);

        文本.onload = () => {
            if(文本.result) {
                var 文件路径 = 打开文本按钮.formAction
                var 文件名称 = 打开文本按钮.files[0].name
                网页显示文本(文本.result)
            }
        };
    }

    
}




 




//---------- 运行 ----------------------------------------------
const 网页服务 = new 网页服务类()
网页服务.发送消息({ 类型:'主页信令.启动.查询git状态' })
网页服务.发送消息({ 类型:'主页信令.启动.查询nodejs状态' })
网页服务.发送消息({ 类型:'主页信令.启动.查询常用软件状态' })



//---------- 处理 vscode 发来的消息 ------------------------------
window.addEventListener('message', event => {    
    const 信令 = event.data;  

    // 快捷键  Ctrl+k 再按 Ctrl+3  折叠所有信令
    const 信令对应函数表 = {    
        '插件信令.启动.git状态':()=>{
         //   网页服务.元素('显示卡片_标题1').innerHTML=`<h5>git</h5>`   
            if( 信令.git版本 === "未安装"){
                网页服务.元素('显示卡片_卡片1').style.background="#ff336630"
            }  
            网页服务.元素('显示卡片_文本1').innerHTML=` <p>git版本：  ${信令.git版本} </p>  
                                                    <p>git用户名： ${信令.git用户名} </p>  
                                                    <p>git邮箱：  ${信令.git邮箱}    </p>
                                                    <p>gitee安全连接: ${信令.gitee安全连接}  </p>
                                                    <HR style= " border: 1 dashed #33658d31" width ="100%" color =#987 cb 9 SIZE = 1>
                                                    <p>python版本： ${信令.python版本}  </p>
                                                    <p>pip3版本： ${信令.pip3版本}  </p> 
                                                    <HR style= " border: 1 dashed #33658d31" width ="100%" color =#987 cb 9 SIZE = 1>
                                                    <p>putty版本： ${信令.putty版本}  </p> 
                                                    `
        },
        '插件信令.启动.nodejs状态':()=>{
        //    网页服务.元素('显示卡片_标题2').innerHTML=`<h5>nodejs</h5>`   
            if( 信令.nodejs版本 === "未安装"){
                网页服务.元素('显示卡片_卡片2').style.background="#ff336630" 
            }
            网页服务.元素('显示卡片_文本2').innerHTML =`<p>node 版本： ${信令.nodejs版本}  </p>
                                                    <p>npm 版本：${信令.nodejs_npm版本} </p>  
                                                    <p>npm 仓库： ${信令.nodejs_npm仓库} </p>
                                                    <HR style= " border: 1 dashed #33658d31" width ="100%" color =#987 cb 9 SIZE = 1>
                                                    <p>vsce 版本： ${信令.vsce版本} </p>
                                                    <p>vsce 登陆用户： ${信令.vsce登陆用户} </p>
                                                    <HR style= " border: 1 dashed #33658d31" width ="100%" color =#987 cb 9 SIZE = 1>
                                                    <p>electron forge 版本： ${信令.electron_forge版本} </p>
                                                    <p>rpm 版本： ${信令.rpm版本} </p>`;
                                            
        },
        '主页信令.启动.常用软件状态':()=>{
        //    网页服务.元素('显示卡片_标题3').innerHTML=`<h5>常用软件</h5>`   
            网页服务.元素('显示卡片_文本3').innerHTML =`
                                                    <p>vscode 版本： ${信令.vscode版本}  </p>
                                                    <p>msedge 版本：${信令.msedge版本} </p>  
                                                    <HR style= " border: 1 dashed #33658d31" width ="100%" color =#987 cb 9 SIZE = 1>
                                                    <p>qbtorrent 版本：${信令.qbtorrent版本} </p>  
                                                    <p>vbox 版本： ${信令.vbox版本} </p>
                                                    <p>xdm 下载工具： ${信令.xdm下载工具} </p>
                                                    <p>krita 版本： ${信令.krita版本} </p>
                                                    <p>nomacs 版本： ${信令.nomacs版本} </p>
                                                    <p>gimp 版本： ${信令.gimp版本} </p>`;
        }

    }  
    if( typeof(信令对应函数表[信令.类型]) === 'function') {   
            信令对应函数表[信令.类型]()   ;     //调用映射函数
    }else   console.log("护眼主题:未识别插件信令🔥："+ 信令.类型 ) ;      //查不到是 undfined


});




//---------- 网页事件 ------------------------------
let 定时器 
const 网页事件表={
    "按钮.打开插件设置":()=>{  网页服务.发送消息({类型: '主页信令.设置.打开插件设置'});},
    "按钮.打开配色文件":()=>{ 网页服务.发送消息({类型: '主页信令.设置.打开配色文件'});},
    "按钮.插件切换主题":()=>{ 网页服务.发送消息({类型: '主页信令.设置.插件切换主题'});},
    "按钮.配置Linux":()=>{ 网页服务.发送消息({类型: '主页信令.设置.配置Linux'});},
    "按钮.刷新仓库":()=>{  网页服务.发送消息({类型: '主页信令.设置.刷新仓库'}) },
}

let 按钮li节点数组 =  网页服务.从classname找到节点数组("按钮区域")[0].firstElementChild.children 
按钮li节点数组[0].firstElementChild.onclick=网页事件表["按钮.打开插件设置"]  //给按钮图片元素赋予点击事件
按钮li节点数组[1].firstElementChild.onclick=网页事件表["按钮.插件切换主题"]
按钮li节点数组[2].firstElementChild.onclick=网页事件表["按钮.打开配色文件"]
按钮li节点数组[3].firstElementChild.onclick=网页事件表["按钮.刷新仓库"]
按钮li节点数组[4].firstElementChild.onclick=网页事件表["按钮.配置Linux"]

 
let 菜单div节点数组 =  网页服务.从classname找到节点数组("功能条")[0].children 
菜单div节点数组[0].innerHTML="深度系统"
菜单div节点数组[0].onclick=()=>{ 网页服务.发送消息({类型: '主页信令.菜单.打开网页', 网址:"https://bbs.deepin.org/"});   }
菜单div节点数组[1].innerHTML="开放麒麟"
菜单div节点数组[1].onclick=()=>{ 网页服务.发送消息({类型: '主页信令.菜单.打开网页', 网址:"https://www.openkylin.top"}); }
菜单div节点数组[2].innerHTML="vscode商店"
菜单div节点数组[2].onclick=()=>{ 网页服务.发送消息({类型: '主页信令.菜单.打开网页', 网址:"https://marketplace.visualstudio.com/items?itemName=lwleen.lwleen-theme-vscode-plugin&ssr=false#overview"}); }
菜单div节点数组[3].innerHTML="说明"
菜单div节点数组[3].onclick=()=>{ 网页服务.发送消息({类型: '主页信令.菜单.打开网页', 网址:"https://gitee.com/lwleen/vs/blob/master/README.md"}); }











