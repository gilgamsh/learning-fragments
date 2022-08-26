
const vscode = acquireVsCodeApi()    //api 接

  
/*
function 动画尝试() {  
    动画区 = document.getElementById("动画区id");
    画布 = 动画区.getContext("2d")
 
 
    画布.strokeRect(10,70,100,50);//绘制图形边框
   
}
动画尝试();
*/


//文件树 ================================================
//由于 vscode 安全限制，只能把消息发回插件处理。


class 侧边栏网页服务类{
    constructor(){                //启动时执行
        this.记录点击执行shell指令图标时_鼠标位置 = {}
        this.记录文本框id = null

        this.文件类型图标表={
            "私有仓库文件夹_已下载":'图标_锁',
            "私有仓库文件夹_未下载":'图标_灰色_锁',
            "公有仓库文件夹_已下载":'图标_对号',
            "公有仓库文件夹_未下载":'图标_灰色_对号',
            'fork仓库文件夹_已下载':'图标_克隆',
            'fork仓库文件夹_未下载':'图标_灰色_克隆',

            "文件根目录":"图标_根目录文件夹",
            "文件根目录_仓库":'图标_仓库文件夹',

            "文件夹":"图标_文件夹",
            "文件夹打开":"图标_文件夹打开",

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
            ".mp4": "图标_文件mp4",
            "文件":"图标_文件"      //未识别类型
        }
    }
    选择文件图标(文件项){
      
        if(文件项.类型=== "文件"){
            if( typeof(this.文件类型图标表[文件项.扩展名]) === 'string' )  return this.文件类型图标表[文件项.扩展名];
            else          return  this.文件类型图标表["文件"]; //未识别类型
        } 
        // else if(文件项.类型=== "文件夹"){
        //     if(文件项.打开状态) return this.文件类型图标表["文件夹打开"] 
        //     else return this.文件类型图标表["文件夹"] 
        // }
        else if(文件项.类型=== "文件根目录" || 文件项.类型=== "文件夹"){
            if(文件项.打开状态){
                if(文件项.仓库 )  return this.文件类型图标表["文件根目录_仓库"]
                else            return this.文件类型图标表["文件夹打开"]
            }
            else{
                if(文件项.仓库 )  return this.文件类型图标表["文件根目录_仓库"]
                else            return this.文件类型图标表["文件夹"]
            }
        }
        else if(文件项.类型=== "仓库根目录"){
            if(文件项.gitee仓库.已下载){
                if(文件项.gitee仓库.fork)            return this.文件类型图标表["fork仓库文件夹_已下载"]
                else if( 文件项.gitee仓库.public)    return this.文件类型图标表["公有仓库文件夹_已下载"]
                else if(文件项.gitee仓库.private)    return this.文件类型图标表["私有仓库文件夹_已下载"]
            }
            else{
                if(文件项.gitee仓库.fork)            return this.文件类型图标表["fork仓库文件夹_未下载"]
                else if( 文件项.gitee仓库.public)    return this.文件类型图标表["公有仓库文件夹_未下载"]
                else if( 文件项.gitee仓库.private)   return this.文件类型图标表["私有仓库文件夹_未下载"]
            }
        }
    }

    文件夹打开状态(文件项){
        let 文件夹下节点个数 = this.节点(文件项.路径).childElementCount -1    //  空文件夹只有个标题 即 1  ---> -1 = 0 表示空文件夹
        if(文件夹下节点个数) return true
        else              return false
    }
    打印网页html内容(){
        console.log(document.getElementsByTagName("body")[0])
    }
    按钮单击发送信令(定时器, 信令){
        // let 定时器={   传入的变量
        //     定时器:null,
        // }
        return new Promise((成功后回调,失败后回调)=>{
            clearTimeout(定时器.定时器);
            定时器.定时器=setTimeout(()=>{
                clearTimeout(定时器.定时器)
                vscode.postMessage(信令)
                成功后回调()
            },230)
        })
    }
    按钮双击发送信令(定时器, 信令){
        return new Promise((成功后回调,失败后回调)=>{ 
            clearTimeout(定时器.定时器);//清除第二次的单击事件
            vscode.postMessage(信令)
            成功后回调()
        })
    }
    从id找到节点(id){ return document.getElementById(id)  }
  
    从classname找到节点数组(classname) { return document.getElementsByClassName(classname) }

    生成随机6位字符串(){
        return Math.random().toString(36).slice(-6) 
    }

    文本框失去焦点后销毁(元素 , 时间){
        //  let 元素=document.getElementById(元素id)
            let 定时器 = setTimeout(()=>{
                if(this.记录文本框id){
                    this.记录文本框id = null
                    元素.parentNode.removeChild(元素)      //销毁
                } 
                clearTimeout(定时器)
            }, 时间 * 1000)
            元素.onfocus = ()=>{ clearTimeout(定时器) }
            //元素.onmouseover = ()=>{ 元素.focus()}    
            元素.onblur = ()=>{  this.文本框失去焦点后销毁(元素 , 2) } //失去焦点后再次销毁
    }
    生成文本框(坐标位置 , 标题, 显示文本){
        if(this.记录文本框id) return;  //如果已经存在就退出
    
        let 随机id = this.生成随机6位字符串()
        this.记录文本框id = "文本框"+随机id 

        let 文本框坐标 = {x:"10%"   ,y:  坐标位置.y -170 }   //相对浏览器窗口

        let 文本框 = document.createElement('div'); 
        文本框.id = this.记录文本框id
        文本框.className ="文本框"
        文本框.style.zIndex = 997
        文本框.style.position = "fixed"     //---重要-->生成绝对定位的元素，相对于浏览器窗口进行定位
        文本框.style.width = "190px"        //提示框大小
        文本框.style.height = "150px"  
        文本框.style.left = (文本框坐标.x).toString()      
        文本框.style.top =  (文本框坐标.y).toString() + "px"  // top left  左上角坐标位置 0 0

        文本框.innerHTML=`
                <div  style="margin-top: -40%;margin-left: 2%;color: #217993;">
                    <h4  >${标题}</h4>  
                </div>
                <div    style="margin-top: -67%;margin-left: 2%;">
                    <p  >${显示文本}</p>
                </div>
        ` ///* 设置子元素为相对定位，可让子元素不继承Alpha值 */    //<p style="margin: 5px 0 0 10px">${显示文本}</p>
        document.getElementsByTagName("body")[0].appendChild(文本框)          //整个页面的子元素
        this.文本框失去焦点后销毁( 文本框 , 2)

    }
    生成选择框(坐标位置, 标题 , 显示文本 ){
        return new Promise((成功后回调 , 失败后回调 )=>{
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
            选择框.style.maxWidth="250px"
            选择框.style.minWidth="200px"
            选择框.style.height = "120px"
            选择框.style.left = (选择框坐标.x).toString()
            选择框.style.top =  (选择框坐标.y).toString() + "px"   // top left  左上角坐标位置 0 0
            选择框.innerHTML=`
                <div class="" style="margin-top: -20px;margin-left: -10px;">
                    <!-- <h4>${标题}</h4>  -->
                    <img class="选择框图标">  
                </div>
                <div class="" style="margin-top: -13px;margin-left: 0px;">
                    <p>${显示文本}</p>
                </div>
                <div id="选择框按钮区id" ></div>
            ` 
            document.getElementsByTagName("body")[0].appendChild(选择框)          //整个页面的子元素

            
            let 确认按钮 = document.createElement('button'); 
            确认按钮.id="确认按钮"+ 随机id
            确认按钮.className = '按钮模型 按钮样式2' 
            确认按钮.style.marginLeft = "8%"   // 距离左侧距离

            确认按钮.innerHTML=`<span style="margin-left:-80%">确认</span>` 
            this.节点("选择框按钮区id").appendChild(确认按钮)         
            确认按钮.onclick= ()=>{   //点击此按钮
                选择框.parentNode.removeChild(选择框) 
                成功后回调(window.event)   //window.event  点击后，它就是鼠标事件
            }
            let 取消按钮 = document.createElement('button'); 
            取消按钮.id="取消按钮"+ 随机id
            取消按钮.className = '按钮模型 按钮样式1' 
            取消按钮.style.marginLeft = "10px"     //距离左侧，也就是 确认按钮的距离
            取消按钮.innerHTML=`<span style="margin-left:-80%">取消</span>` 
            this.节点("选择框按钮区id").appendChild(取消按钮)   
            取消按钮.onclick= ()=>{   //点击此按钮
                选择框.parentNode.removeChild(选择框) 
                失败后回调("取消")
            } 
           
        })
    }

    点击后获取鼠标位置(){       //只适合点击情况
        let 当前窗口事件 = window.event
        if(当前窗口事件.type !== undefined && 当前窗口事件.type !==null && 当前窗口事件.type ==="click"){
            return  {x: 当前窗口事件.x, y:当前窗口事件.y } ;
        }
    }
    按钮鼠标悬浮显示通知文本(定时器,元素节点, 文本){
        元素节点.onmouseover = ()=>{  
                clearTimeout(定时器.定时器)            //每次更换显示文本，都要清空定时
                document.getElementById("通知区id").innerHTML = 文本
         }
         元素节点.onmouseleave = ()=>{    // onmouseleave  onblur
                this.通知区显示文本后消失(定时器,文本 ,2)  //延迟消失
        }
    }
    通知区显示文本后消失(定时器, 文本 ,时间){
            clearTimeout(定时器.定时器)
            document.getElementById("通知区id").innerHTML = 文本; 
            定时器.定时器 = setTimeout(() => {
                document.getElementById("通知区id").innerHTML="";
                clearTimeout(定时器)
            }, 时间 * 1000);
    }
    元素( 元素id ){  return document.getElementById(元素id) }
    节点( 节点id ){  return document.getElementById(节点id) }
    发送消息(消息){   vscode.postMessage(消息);   }
    移除网页元素(元素id){
       let 元素=this.元素(元素id)
       if(元素 !== null)  元素.parentNode.removeChild(元素);  // 父元素.removeChild( 子元素 )     
    }  
    条目选中效果(选中元素id, css样式classname){     //选中的那个高亮
        let 旧元素  = this.元素(this.文件树唯一选中元素id)
        if(旧元素)  旧元素.firstElementChild.className= "目录li节点"   //旧元素存在的话恢复之前的
        this.文件树唯一选中元素id = 选中元素id
        this.元素(this.文件树唯一选中元素id).firstElementChild.className= css样式classname 
    }
    右键菜单销毁(菜单元素id){
        if( this.文件树菜单唯一存在 ) {
            this.移除网页元素(菜单元素id)  
            this.文件树菜单唯一存在 = false 
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
        if(文件夹元素 ===null) return
        //只保留第一个元素， 也就是标题。 其他的是文件夹里的内容
        let 第一个元素 = 文件夹元素.firstElementChild   // 或 children[0] 也是第一个
        if(第一个元素 ===null) return
        文件夹元素.innerHTML = ""
        文件夹元素.appendChild(第一个元素)
    }
}


/*  ===========  点击后生成的网页生成的网页实例  =====================================
<div id="div文件目录区id" style="display: block;">                  //显示区域
        <ol id="C:\Users\lwl\测试" class="根目录条目ol样式">        //路径作为id         
            <li class="目录li节点-选中">                            //图标  文件名标题
                <p class="默认img图片 图标_蓝色文件夹打开"></p>  
                <p class="文件名">测试</p>
            </li>
                    <ol id="C:\Users\lwl\测试\新建文件夹" class="文件条目ol样式">      //子文件、文件夹 
                        <li class="目录li节点">              
                                <p class="默认img图片 图标_文件夹"></p>
                                <p class="文件名">新建文件夹</p>
                            </li>
                    </ol>
                    <ol id="C:\Users\lwl\测试\新建文本文档.txt" class="文件条目ol样式">  //子文件、文件夹
                            <li class="目录li节点">              
                                <p class="默认img图片 图标_文件txt"></p>
                                <p class="文件名">新建文本文档.txt</p>
                            </li>
                    </ol>
        </ol>
        <ol id="C:\Users\lwl\.vscode\extensions\lwleen-theme" class="根目录条目ol样式">  
            <li class="目录li节点">              
                        <p class="默认img图片 图标_蓝色文件夹"></p>  
                        <p class="文件名">lwleen-theme</p>
            </li>
        </ol>
</div>
*/
class 文件树服务类 extends 侧边栏网页服务类{
    constructor(){  
        super();

        //------->  用实际路径 作为网页元素id 这样就可以快速定位添加子网页 <----------------


        this.仓库功能开关 =false;

        this.文件树菜单唯一存在 = false       //标记只能有一个菜单
        this.文件树唯一选中元素id = ""        //记录已选中元素 也只能有一个
        this.记录用户点击_鼠标位置 ={}
           
    }

    更新显示文件树(目录数组){
        this.元素("div文件树id").style.display ="block"        //显示区域
        this.元素("div文件目录区id").style.display ="block"     //显示区域
        
        //对以前存在的文件树页面处理
        if(目录数组.length !==0  && ['文件根目录','仓库根目录'].includes(目录数组[0].类型) ){
            this.元素("div文件目录区id").innerHTML=""  //根目录更新就全部清空
        }
        else if(目录数组.length ===0 ){ //空文件夹的情况
            return
        } 
        else if ( 目录数组.length !==0  && ['文件','文件夹'].includes(目录数组[0].类型) ) {
            //这一步保证父节点必须存在
            if(this.节点(目录数组[0].父路径) ===null) return  //父节点不存在，直接退出
            this.清空文件夹网页显示(this.节点(目录数组[0].父路径))
        }  
        
        
        //生成新的文件树页面
        目录数组.forEach(  文件项 =>{                         // 遍历每一个
            let 文件夹网页 = document.createElement('ol');     //每个 ol 一个文件夹/文件   
            文件夹网页.id =  文件项.路径                         //文件路径作为 id

            if(['文件根目录','仓库根目录'].includes(文件项.类型) )  文件夹网页.className  = "根目录条目ol样式"    
            else                  文件夹网页.className  = "文件条目ol样式"    

            let 文件夹图标样式= this.选择文件图标(文件项)
            文件夹网页.innerHTML  =`  <li class="目录li节点" >              
                                            <img class="默认img图片 ${文件夹图标样式}" ></img>  
                                            <p class="文件名" >${文件项.文件名}</p>
                                     </li>
            `;
            if(文件项.类型==='文件根目录'){
                this.元素('div文件目录区id').appendChild(文件夹网页)      //下面是右键事件
            }else if ( 文件项.类型==='仓库根目录'){
                this.元素('div文件目录区id').appendChild(文件夹网页)      //下面是右键事件
            }else if( ['文件','文件夹'].includes(文件项.类型) ){
                this.元素(文件项.父路径).appendChild(文件夹网页)  
            }

            文件夹网页.oncontextmenu = 鼠标事件=> {this.生成文件树右键菜单(鼠标事件,文件项 ) }
            文件夹网页.onclick = 鼠标事件=> {
                鼠标事件.stopPropagation()              //取消事件向父元素传递
                this.文件树左键事件回调(文件项 ) 
            }

            if(文件项.子文件数组.length !==0 ) this.更新显示文件树(文件项.子文件数组)   //递归调用，显示子文件夹
        })

        //如果仓库显示区是空的，那么隐藏它
        if(this.节点("div文件目录区id").firstElementChild  === null)   this.节点("div文件目录区id").style.display ="none"
    }

    文件树左键事件回调(文件项){
            this.条目选中效果( 文件项.路径 , "目录li节点-选中")
            if( ["文件夹","仓库根目录","文件根目录"].includes(文件项.类型) ) {
                    //---------切换图标--------------------
                    let 用户操作=""
                    let 文件夹图标样式=""
                    if(文件项.打开状态){        // 已打开
                        this.清空文件夹网页显示(this.节点(文件项.路径)) 
                        用户操作="关闭文件夹"
                        文件项.打开状态=false   // 关闭
                        文件夹图标样式= this.选择文件图标(文件项 )
                    } else{
                        用户操作="打开文件夹"
                        文件项.打开状态=true
                        文件夹图标样式= this.选择文件图标(文件项 )  
                        
                    }
                    let 文件项图标img节点= this.节点(文件项.路径).firstElementChild.firstElementChild
                    文件项图标img节点.className="默认img图片 "+文件夹图标样式
                    //------------------------------------

                this.发送消息({类型:"文件树.点击.用户点击文件树" , 用户操作: 用户操作,  文件项:文件项})       //发送消息， 来加载目录   返回文件夹数组
            }else if(文件项.类型 === "文件"){
                this.发送消息({类型:"文件树.点击.打开本地文件" , 文件项:文件项})
            }else{
                console.log("📒文件树左键事件回调📒未定义类型")
            }
    }
    生成文件树右键菜单(鼠标事件, 文件项 ){           // 菜单  文件右键  
        document.oncontextmenu = ()=> { return false;}//整个页面的js事件   阻止自带的右键弹窗 
        if(this.文件树菜单唯一存在) return;   
        else this.文件树菜单唯一存在 = true;
        this.条目选中效果( 文件项.路径 , "目录li节点-选中")
        
        let 菜单 = document.createElement('menu');
        菜单.id ="文件夹菜单id"
        菜单.className="默认菜单"
        菜单.style.width="120px"
        菜单.style.type ="context"
        菜单.style.position = "fixed"     //生成绝对定位的元素，相对于浏览器窗口进行定位
        菜单.style.zIndex = 999 //最上层

        let 菜单数组=[]
        if(文件项.类型==="文件" || 文件项.类型==="文件夹"){
            菜单数组 = ["打开文件夹" ,"打开终端" ,"编辑此项目","分割线",
                        "静态文件服务","分割线",
                        "新建文件夹","新建文件","重命名","删除","分割线2",
                        "项目主页"]
            //视频文件
            if( [ ".mp4" ,".mkv" ].includes(文件项.扩展名)  && 文件项.类型 === "文件"){
                菜单数组.unshift("分割线")
                菜单数组.unshift("合并多段视频")
                菜单数组.unshift("分割线")
                菜单数组.unshift("播放")
            }
            else if( [ ".sh" ].includes(文件项.扩展名)  && 文件项.类型 === "文件"){
                菜单数组.unshift("分割线")
                菜单数组.unshift("运行sh脚本")
            }
            else if( [ ".html" ].includes(文件项.扩展名)  && 文件项.类型 === "文件"){
                菜单数组.unshift("分割线")
                菜单数组.unshift("浏览器打开html")
            }
            else if( [ ".md" ].includes(文件项.扩展名)  && 文件项.类型 === "文件"){
                菜单数组.unshift("分割线")
                菜单数组.unshift("预览md文件")
            }
            //非仓库
            if(!文件项.仓库){  
                菜单数组=菜单数组.filter(菜单项=> 菜单项 !== "分割线2")
                菜单数组=菜单数组.filter(菜单项=> 菜单项 !== "项目主页")
            }
            菜单.innerHTML=菜单数组.map(菜单项=>{
                if(菜单项==="分割线"|| 菜单项==="分割线2") return `<hr>`
                else return `<menuitem label=${菜单项}  ></menuitem>`
            }).join("")
        }
        else if(文件项.类型==="文件根目录"){
                菜单数组 = ["打开文件夹" ,"打开终端" ,"编辑此项目","分割线",
                            "静态文件服务","分割线",
                            "新建文件夹","新建文件","重命名","关闭此目录","分割线2",
                            "项目主页","推送仓库"]
                //非仓库
                if(!文件项.仓库){
                    菜单数组=菜单数组.filter(菜单项=> 菜单项 !== "分割线2")
                    菜单数组=菜单数组.filter(菜单项=> 菜单项 !== "项目主页")
                    菜单数组=菜单数组.filter(菜单项=> 菜单项 !== "推送仓库")
                }
                菜单.innerHTML=菜单数组.map(菜单项=>{
                    if(菜单项==="分割线" || 菜单项==="分割线2") return `<hr>`
                    else return `<menuitem label=${菜单项}  ></menuitem>`
                }).join("")

        } 
        else if(文件项.类型==="仓库根目录"){
                菜单数组 = ["打开文件夹" ,"打开终端" ,"编辑此项目","分割线",
                            "静态文件服务","分割线",
                            "新建文件夹","新建文件","下载项目","删除本地仓库","分割线",
                            "项目主页","推送仓库"]
                //仓库没有下载
                if(文件项.gitee仓库.已下载 === false){  
                    菜单数组 = ["下载项目","分割线","项目主页"]
                }
                //仓库已经下载
                else if(文件项.gitee仓库.已下载 === true){  
                    菜单数组=菜单数组.filter(菜单项=> 菜单项 !== "下载项目")
                }
                菜单.innerHTML=菜单数组.map(菜单项=>{
                    if(菜单项==="分割线") return `<hr>`
                    else return `<menuitem label=${菜单项}  ></menuitem>`
                }).join("")
        }

        this.节点(文件项.路径).appendChild(菜单)    //生成菜单
        this.菜单位置定位(菜单, 鼠标事件)
        
        //文档其他地方点击后  销毁菜单
        document.onmousedown=鼠标事件=>{ if(this.文件树菜单唯一存在  && 鼠标事件.target.localName !== "menuitem")  this.右键菜单销毁(菜单.id)  } //点击非菜单元素后， 销毁菜单 
        document.onmouseleave=()=>{ if(this.文件树菜单唯一存在)  this.右键菜单销毁(菜单.id) }  
        //点击菜单
        菜单.onclick = (鼠标事件)=> { 
                
                let 菜单点击事件回调函数表={
                    "打开文件夹":()=>{      //发送 信令格式  {类型:"打开文件夹" , 绝对路径:文件项.路径}
                        this.发送消息({类型:"文件树.菜单.打开文件夹" , 文件项:文件项}) 
                     },
                    "打开终端":()=>{
                        this.发送消息({类型:"文件树.菜单.打开终端界面"  ,文件项:文件项 }); 
                    },
                   "编辑此项目":()=>{        
                        this.发送消息({类型:"文件树.菜单.编辑文件项目"   , 文件项:文件项   }); 
                    },   
                   "关闭此目录": ()=>{     
                        this.发送消息({类型:"文件树.菜单.关闭此目录" , 文件项:文件项}) 
                    },
                    "静态文件服务":()=>{
                        this.生成选择框({x:鼠标事件.x, y: 鼠标事件.y + 45}, "?" , "创建静态服务器  " + 文件项.文件名 + "  吗")
                            .then(()=>{
                                this.发送消息({类型:"文件树.菜单.http静态文件服务器"  ,文件项:文件项 }); 
                            })
                            .catch(()=>{ console.log("护眼主题： 用户点击取消") })
                    },
                    "新建文件夹":()=>{      //发送 信令格式  {类型:"新建文件夹" , 文件项:文件项}
                        this.右键菜单销毁(点击的菜单项.parentNode.id)     //销毁菜单
                        this.新建文件过程(文件项, "文件夹")
                    },
                    "新建文件":()=>{        //发送 信令格式   {类型:"新建文件" , 文件项:文件项}
                        this.右键菜单销毁(点击的菜单项.parentNode.id)     //销毁菜单
                        this.新建文件过程(文件项, "文件")
                    },
                    "重命名":()=>{         //发送 信令格式   {类型:"重命名文件" , 绝对路径:文件项.路径 , 新路径: 新路径}
                        this.重命名文件过程(文件项)
                    },
                    "删除":()=>{          //发送 信令格式   {类型:"删除文件" , 文件项:文件项}
                        this.生成选择框({x:鼠标事件.x, y:鼠标事件.y}, "?" , "删除  "+ 文件项.文件名 +" ")
                            .then(()=>{
                                this.发送消息({类型:"文件树.菜单.删除文件" , 文件项:文件项}) 
                                this.条目选中效果( 文件项.路径, "目录li节点-删除" ) 
                            })
                            .catch(()=>{ console.log("护眼主题： 用户点击取消") })
                     },

                    "项目主页":()=>{ 
                        this.发送消息({类型:"文件树.菜单.打开项目主页" , 文件项:文件项}) 
                    },
                    "下载项目":()=>{        //发送 信令格式  {类型:"下载仓库"  ,仓库:仓库项   }
                        vscode.postMessage({类型:"文件树.菜单.下载仓库"  ,文件项:文件项   });  // 由另一方判断仓库是否存在
                        this.条目选中效果( 文件项.路径 , "目录li节点-下载仓库")
                    },
                    "删除本地仓库":()=>{     //发送 信令格式  {类型:"删除本地仓库文件" , 路径:仓库项.路径   }
                        this.生成选择框({x:鼠标事件.x, y:鼠标事件.y}, "?" , "删除本地仓库  "+ 文件项.文件名 +" 吗")
                        .then(()=>{
                            vscode.postMessage({类型:"文件树.菜单.删除本地仓库文件" , 文件项:文件项   });
                            this.条目选中效果( 文件项.路径, "目录li节点-删除" )
                        }) 
                        .catch(()=>{ console.log("护眼主题： 用户点击取消") })
                    },
                    "推送仓库":()=>{        //发送 信令格式  {类型:"推送仓库" , 推送指令:推送指令   }
                        this.生成选择框({x:鼠标事件.x, y:鼠标事件.y}, "?" , "推送  "+ 文件项.文件名 +" 吗")
                            .then(()=>{
                                this.发送消息({类型:"文件树.菜单.推送仓库" , 文件项:文件项 }) 
                                this.条目选中效果( 文件项.路径 , "目录li节点-推送仓库")
                                this.记录用户点击_鼠标位置 = {x:鼠标事件.x, y:鼠标事件.y}
                            })
                            .catch(()=>{ console.log("护眼主题： 用户点击取消") })
                    },

                    "播放":()=>{
                    // let 视频播放器 = this.元素("视频播放器id")
                    // 视频播放器.style.height="150px"
                    // 视频播放器.style.width="100%"
                    // 视频播放器.setAttribute("controls",true)
                    // 视频播放器.setAttribute("src"," http://0.0.0.0:8080/D17720AEDA2476A95126771652B33480_20220729_1_1_2154.mp4")

                        this.发送消息({类型:"文件树.菜单.文件相关打开操作" ,操作类型:"播放视频",文件项:文件项  }); 
                    },
                    "合并多段视频":()=>{
                        this.生成选择框({x:鼠标事件.x, y:鼠标事件.y}, "?" , "请确保视频格式都相同的")
                                .then(()=>{
                                    this.发送消息({类型:"文件树.菜单.文件相关打开操作" ,操作类型:"合并多段视频",文件项:文件项 }); 
                                })
                                .catch(()=>{ console.log("护眼主题： 用户点击取消") })
                    },
                    "浏览器打开html":()=>{
                        this.发送消息({类型:"文件树.菜单.文件相关打开操作" ,操作类型:"浏览器打开html",文件项:文件项 })
                    },
                    "运行sh脚本":()=>{
                        this.生成选择框({x:鼠标事件.x, y:鼠标事件.y}, "?" , "请确保 sh 文件有执行权限")
                        .then(()=>{
                            this.发送消息({类型:"文件树.菜单.文件相关打开操作" ,操作类型:"运行sh脚本",文件项:文件项 }); 
                        })
                        .catch(()=>{ console.log("护眼主题： 用户点击取消") })
                    },
                    "预览md文件":()=>{
                        this.发送消息({类型:"文件树.菜单.文件相关打开操作" ,操作类型:"预览md文件",文件项:文件项 })
                    }
                }
            
                //点击菜单事件
                鼠标事件.stopPropagation()                      // 阻止事件向父元素传递
                let 点击的菜单项 = 鼠标事件.target
                菜单点击事件回调函数表[ 点击的菜单项.getAttribute("label") ]()
                this.右键菜单销毁(点击的菜单项.parentNode.id)     //销毁菜单
        }
    }  
    
    新建文件过程(文件项, 要创建文件类型){
  
        this.条目选中效果(文件项.路径,"目录li节点")
        let 虚拟文件 = document.createElement('ol');
        虚拟文件.className  = "文件条目ol样式"  
        let 图标样式 = ""
        if(要创建文件类型 === "文件") 图标样式 = "图标_文件"
        else if(要创建文件类型 === "文件夹") 图标样式 = "图标_文件夹"

        虚拟文件.innerHTML  =` <li class="目录li节点-重命名" >              
                                        <p class="默认img图片 ${图标样式}"></p>
                                        <p class="文件名" id="新建文件id"></p>
                                </li>
        `;

        //文件夹是否打开， 未打开的要主动打开
        if(文件项.类型 === "文件") this.元素(文件项.父路径).insertBefore( 虚拟文件 ,this.元素(文件项.路径) )  
        else if( ["文件夹","仓库根目录","文件根目录"].includes(文件项.类型)  &&  文件项.打开状态 ){  //已经打开的文件夹

                let 文件夹下第一个ol节点=this.元素(文件项.路径).firstElementChild.nextSibling  //第一个文件
                this.元素(文件项.路径).insertBefore(虚拟文件, 文件夹下第一个ol节点) 

        }
        else if( ["文件夹","仓库根目录","文件根目录"].includes(文件项.类型)  && 文件项.打开状态===false){  //已经打开的文件夹
            this.文件树左键事件回调(文件项)   //如果没有打开，就打开
                // 等待执行完成   this.元素(文件项.路径).appendChild(虚拟文件) 
            setTimeout(()=>{ this.新建文件过程(文件项, 要创建文件类型)  }, 200)   // 退出，等待文件夹打开 再次新建
          return
        }
 
        let 虚拟文件名元素 = this.元素("新建文件id")
        虚拟文件名元素.setAttribute("contenteditable","plaintext-only")    //可读写 
        虚拟文件名元素.onkeydown=(按键)=>{ if(按键.code === "Enter" ||按键.code === "Escape" ) 虚拟文件名元素.blur()  }   //主动失去焦点    
        虚拟文件名元素.onblur= ()=> {
            let 新文件名 = 虚拟文件名元素.innerText
            虚拟文件.parentNode.removeChild(虚拟文件);   //输入文件名过程结束

            //下面是获得的新文件对象，发送信令，让插件来新建文件
            if(! 新文件名)  return //不能为空
            let 新文件项 = {} 
            新文件项.类型 = 要创建文件类型    //新建的是文件还是文件夹
            if(文件项.类型 === "文件")  新文件项.父路径= 文件项.父路径
            else                      新文件项.父路径= 文件项.路径
            新文件项.文件名=  新文件名

            this.发送消息({类型:"文件树.菜单.新建文件" , 新文件项:新文件项})  
        } 
        //激活输入文件名
        虚拟文件名元素.focus()
    }
    重命名文件过程(文件项){
        let 文件名元素 = this.元素(文件项.路径).firstElementChild.children[1]  //文件项.路径 是ol的id 第一个子元素是 li , li下第二个子元素是文件名
        this.条目选中效果(文件名元素.parentNode.parentNode.id, "目录li节点-重命名")
        let 旧文件名=文件名元素.innerText
        文件名元素.setAttribute("contenteditable","plaintext-only")    //可读写
        
        let 文件ol元素 = 文件名元素.parentNode.parentNode     //避免与旧事件冲突 
        let 已存onclick事件函数 =  文件ol元素.onclick  
        let 已存菜单事件函数 = 文件ol元素.oncontextmenu
        文件ol元素.oncontextmenu = 鼠标事件=>{ 鼠标事件.stopPropagation();   return  false }
        文件ol元素.onclick = 鼠标事件=>{ 鼠标事件.stopPropagation();  return   }  
        
        文件名元素.focus=()=>{    //聚焦后，移动鼠标到文本最后
            let 范围 = document.createRange();
            范围.selectNodeContents(文件名元素);
            范围.collapse(false);
            let 选中 = window.getSelection();
            选中.removeAllRanges();
            选中.addRange(范围);
        }
        文件名元素.onkeydown=(按键)=>{  if(按键.code === "Enter" ||按键.code === "Escape") 文件名元素.blur()  }   //主动失去焦点    
        文件名元素.onblur= ()=> {
            文件ol元素.onclick = 已存onclick事件函数
            文件ol元素.oncontextmenu = 已存菜单事件函数       //恢复旧事件

            let 新文件名 = 文件名元素.innerText
            // 恢复
            文件名元素.innerText=旧文件名 
            this.条目选中效果(文件名元素.parentNode.parentNode.id , "目录li节点-选中")
            文件名元素.setAttribute("contenteditable","false")  //恢复不可读写

            if(新文件名 === 文件项.文件名) return;                           //未改变
            if(! 新文件名) {  文件名元素.innerText = 文件项.文件名 ; return } //输入空

            this.发送消息({类型:"文件树.菜单.重命名" , 文件项:文件项 , 新文件名: 新文件名})  
      
        } 
        
        //激活重命名聚焦
        文件名元素.focus()
    }

}







//---------- 运行 --------------------------------
var 全局_通知区定时器={定时器:null}
let 全局_按钮点击定时器={ 定时器:null, }

var 网页服务 = new 侧边栏网页服务类();
var 文件树服务 = new 文件树服务类();
 
网页服务.发送消息({类型: "启动.查询文件树目录"})  // 网页最后加载，由此网页主动发起请求
//网页服务.发送消息({类型: "启动.查询根目录"})    // 需要获取是否开启了 仓库功能 
网页服务.发送消息({类型: "启动.查询中英标点转换状态"})   
网页服务.发送消息({类型: "启动.查询显示悬浮动画"});     
 

网页服务.通知区显示文本后消失(全局_通知区定时器, "欢迎", 2)   //占位，如果什么不显示这个区域的高度为0   影响布局

 
//网页服务.打印网页html内容()




//---------- 处理 vscode 发来的消息 --------------------------------
window.addEventListener('message', event => {    
    const 信令 = event.data; //  插件发来的数据对象  { 类型:   文本: }

    // 快捷键  Ctrl+k 再按 Ctrl+3  折叠所有信令
    const 信令对应函数表 = {    
        //由插件主动发起的信令 --插件信令-- 命名
        //其他都是回应

        "插件信令.切换中英标点图表明亮度":()=>{
            let 按钮li节点数组 =  网页服务.从classname找到节点数组("div按钮区域")[0].firstElementChild.children 
            let 符号转换元素 = 按钮li节点数组[2].firstElementChild
            if(信令.开关){    //开启状态
                符号转换元素.style.filter="brightness(95%)"
            }else{
                符号转换元素.style.filter="brightness(85%)"
            }
        },
        "插件信令.开关文件树显示": ()=>{                     // 信令格式    {类型:"仓库功能开关", 启用: true }
            文件树服务.仓库功能开关 = 信令.启用              //记录保存
            let 文件树元素 = document.getElementById("div文件树id")
            if(信令.启用 ) 文件树元素.style.display ="block"            // div仓库目录区id   有内容才显示
            else 文件树元素.style.display ="none"
        },
        "插件信令.通知区显示文本": ()=>{                          // 信令格式    { 类型:"通知" ,  文本: '正在刷新'}
            网页服务.通知区显示文本后消失(全局_通知区定时器, 信令.文本, 3)
        },
        "插件信令.弹出文本框显示信息":()=>{            // 信令格式    { 类型:"shell指令提示条" ,  文本: '终端输出内容 ...'}
            网页服务.生成文本框(网页服务.记录点击执行shell指令图标时_鼠标位置 ,   信令.标题 , 信令.文本)
        },
        "插件信令.开关宇航员动画":()=>{
            if(信令.动画类型 === "宇航员动画"){
                document.getElementById("漂浮动画区id").innerHTML = null ; 
                let 宇航员动画 =  document.createElement('div');
                宇航员动画.id = "宇航员漂浮动画id";
                宇航员动画.innerHTML = ''
                document.getElementById("漂浮动画区id").appendChild(宇航员动画);
            }else if(信令.动画类型 === "关闭动画"){
                document.getElementById("漂浮动画区id").innerHTML = null ; 
            }
            
        },


        "插件信令.更新显示文件树": ()=>{    //关闭项目会触发刷新显示， 这里出现全空情况
            文件树服务.更新显示文件树(信令.目录数组)
        },
        
        "文件树.菜单.推送仓库操作完成" :()=>{                // 信令格式     {类型:"推送仓库操作完成", 路径: 消息.路径}
            网页服务.生成文本框(文件树服务.记录用户点击_鼠标位置 ,   "推送日志： \n" , 信令.显示文本)
            文件树服务.条目选中效果(信令.文件项.路径, "目录li节点-选中")  //用路径用作 html 显示ol的 id  
        },
        "文件树.菜单.删除文件失败" : ()=>{                 // 信令格式     {类型:"删除文件失败", 路径:文件路径 }
            文件树服务.条目选中效果(信令.文件项.路径, "目录li节点-选中")
        },
        "文件树.菜单.删除仓库失败" : ()=>{                  // 信令格式     {类型:"删除仓库失败", 路径: 消息.路径}
            文件树服务.条目选中效果(信令.文件项.路径, "目录li节点-选中")
        },
        "文件树.菜单.无法下载仓库" : ()=>{                 // 信令格式     {类型:"无法下载仓库", 路径:消息.仓库.路径 }
            文件树服务.条目选中效果(信令.文件项.路径, "目录li节点-选中")  //用路径用作 html 显示ol的 id 
        },

    }  
    if( typeof(信令对应函数表[信令.类型]) === 'function') {   
            信令对应函数表[信令.类型]()   ;     //调用映射函数
    }else   console.log("护眼主题:未识别插件信令🔥："+ 信令.类型 ) ;      //查不到是 undfined


});









//---------- 网页事件 ------------------------------



const 网页事件表={
    "文件树.标题单击.打开本地根目录":()=>{
        网页服务.按钮单击发送信令(全局_按钮点击定时器 , {类型:'文件树.标题.打开窗口选择本地根目录'} )  
    },
    "文件树.标题双击.打开插件设置":()=>{
        网页服务.按钮双击发送信令(全局_按钮点击定时器 , {类型:'按钮.打开插件设置'} )  
    },

    "按钮.开关中英标点转换":()=>{
        网页服务.按钮单击发送信令(全局_按钮点击定时器 ,{类型:'按钮.开关中英标点转换'} )    
    },

    "按钮.打开说明页":()=>{
        网页服务.按钮单击发送信令(全局_按钮点击定时器 ,{类型:'按钮.打开说明页'})     
    },

    "按钮.打开插件目录":()=>{
        网页服务.按钮单击发送信令(全局_按钮点击定时器 ,{类型:'按钮.打开插件目录'})   
    },

    "按钮.打开配色文件":()=>{
        网页服务.按钮单击发送信令(全局_按钮点击定时器 ,{类型:'按钮.打开配色文件'})   
    },
    "按钮.插件切换主题":()=>{
        网页服务.按钮单击发送信令(全局_按钮点击定时器 ,{类型:'按钮.插件切换主题'})  
    },
    "按钮.打开本地仓库目录":()=>{
        网页服务.按钮单击发送信令(全局_按钮点击定时器 , {类型:'按钮.打开本地仓库目录'}  )
    },
    "按钮双击.打开一个系统终端":()=>{
        网页服务.按钮双击发送信令(全局_按钮点击定时器 , {类型:'按钮.打开一个系统终端'} )
    },      
                        
    "按钮.执行shell指令":()=>{
        网页服务.记录点击执行shell指令图标时_鼠标位置 = 网页服务.点击后获取鼠标位置()   //后面用于生成消息窗口
        网页服务.按钮单击发送信令(全局_按钮点击定时器 ,{类型:'按钮.执行shell指令'} )  
    },
    "按钮双击.打开shell指令配置页面":()=>{
        网页服务.按钮双击发送信令(全局_按钮点击定时器 ,{类型:'按钮.打开shell指令配置页面'} )
    },

    "按钮.刷新仓库":()=>{
        网页服务.按钮单击发送信令(全局_按钮点击定时器 ,{类型:'按钮.刷新仓库'} )
    },
    "按钮双击.打开gitee令牌配置页面":()=>{
        网页服务.按钮双击发送信令(全局_按钮点击定时器 , {类型:'按钮.打开gitee令牌配置页面'} )
        网页服务.通知区显示文本后消失(全局_通知区定时器, "请输入gitee令牌" , 3)  
    },

    "按钮.打开插件设置":()=>{   
        网页服务.按钮单击发送信令(全局_按钮点击定时器 ,{类型:'按钮.打开插件设置'} )
    },
    "按钮双击.配置Linux":()=>{
        网页服务.按钮双击发送信令(全局_按钮点击定时器 , {类型:'按钮.配置Linux'}  )
        网页服务.通知区显示文本后消失(全局_通知区定时器, "配置Linux" , 3)  
    },

    "按钮.打开主页":()=>{
        网页服务.按钮单击发送信令(全局_按钮点击定时器 ,{类型:'按钮.打开欢迎主页'} )
    },
    "按钮双击.重启护眼主题插件":()=>{
        网页服务.按钮双击发送信令(全局_按钮点击定时器 , {类型:'按钮.重启护眼主题插件'} )
        网页服务.通知区显示文本后消失(全局_通知区定时器, "重启插件" , 3)  
    },

}




//----绑定事件-----
网页服务.节点("我的仓库标题id").onclick=网页事件表["文件树.标题单击.打开本地根目录"] 
网页服务.节点("我的仓库标题id").ondblclick=网页事件表["按钮双击.打开一个系统终端"] 

let 按钮li节点数组 =  网页服务.从classname找到节点数组("div按钮区域")[0].firstElementChild.children 
按钮li节点数组[0].firstElementChild.onclick=网页事件表["按钮.打开插件设置"]  //给按钮图片元素赋予点击事件
按钮li节点数组[0].firstElementChild.ondblclick=网页事件表["按钮双击.配置Linux"]

按钮li节点数组[1].firstElementChild.onclick=网页事件表["按钮.打开主页"]
按钮li节点数组[1].firstElementChild.ondblclick=网页事件表["按钮双击.重启护眼主题插件"]

按钮li节点数组[2].firstElementChild.onclick=网页事件表["按钮.开关中英标点转换"]
按钮li节点数组[3].firstElementChild.onclick=网页事件表["按钮.插件切换主题"]

按钮li节点数组[4].firstElementChild.onclick=网页事件表["按钮.打开配色文件"]
按钮li节点数组[5].firstElementChild.onclick=网页事件表["按钮.打开插件目录"]
按钮li节点数组[6].firstElementChild.onclick=网页事件表["按钮.刷新仓库"]
按钮li节点数组[6].firstElementChild.ondblclick=网页事件表["按钮双击.打开gitee令牌配置页面"]

按钮li节点数组[7].firstElementChild.onclick=网页事件表["按钮.打开本地仓库目录"]
按钮li节点数组[7].firstElementChild.ondblclick=网页事件表["按钮双击.打开一个系统终端"]
按钮li节点数组[8].firstElementChild.onclick=网页事件表["按钮.执行shell指令"]
按钮li节点数组[8].firstElementChild.ondblclick=网页事件表["按钮双击.打开shell指令配置页面"]


//图标上悬浮发生的事件 ================================================
网页服务.按钮鼠标悬浮显示通知文本(全局_通知区定时器, 按钮li节点数组[0], "打开设置")
网页服务.按钮鼠标悬浮显示通知文本(全局_通知区定时器, 按钮li节点数组[1], "欢迎主页")

按钮li节点数组[2].onmouseover =()=>{ //悬浮执行
    网页服务.发送消息({类型:'按钮.中英符号转换图标鼠标悬浮'});  //插件信令.鼠标悬浮读取的标点转换状态
}
网页服务.按钮鼠标悬浮显示通知文本(全局_通知区定时器, 按钮li节点数组[3], "切换主题")
网页服务.按钮鼠标悬浮显示通知文本(全局_通知区定时器, 按钮li节点数组[4], "配色文件🌈")
网页服务.按钮鼠标悬浮显示通知文本(全局_通知区定时器, 按钮li节点数组[5], "插件目录")

网页服务.按钮鼠标悬浮显示通知文本(全局_通知区定时器, 按钮li节点数组[6], "刷新仓库")
网页服务.按钮鼠标悬浮显示通知文本(全局_通知区定时器, 按钮li节点数组[7], "打开仓库目录")

按钮li节点数组[8].onmouseover =()=>{ //悬浮执行
    网页服务.发送消息({类型:'按钮.shell指令图标鼠标悬浮'});   //插件信令.鼠标悬浮读取的shell指令
}  







 
/*

function 网页显示文本(文本) {
    let 字符串 = String(文本);
    var 文本_处理换行符 = 字符串.replace( /\n/g , '<br>'); 
    var 文本_处理空格 = 文本_处理换行符.replace( /\s/g , '&nbsp;'  );
    document.getElementById("文本显示区").innerHTML = 文本_处理空格 ;

}


// alert("这条指令会弹出一个提示");



function 下载到电脑(文件名, 字符串) {
    var 模拟链接 = window.URL || window.webkitURL || window;
    var 文本 = new Blob([字符串]);
    //                指定与元素相关联的命名空间URI的字符串---> HTML    http://www.w3.org/1999/xhtml
    var 下载链接 = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
    下载链接.href = 模拟链接.createObjectURL(文本);
    下载链接.download = 文件名;

    //模拟鼠标事件
    var 自定义事件 = document.createEvent("MouseEvents");
    自定义事件.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    下载链接.dispatchEvent(自定义事件);
} 

*/

