
function 安装ffmpeg(){  #下载网址   #安装位置
    查询指令路径 ffmpeg     
    if [ $? -eq 0 ];then
        终端显示 ${bold_green_word} "ffmpeg 已安装"   
        return 0
    fi
    #======== 官网下载包 ============== 
    local dl_url=$1
    local dir=$2

    截取路径里文件名 $dl_url
    local tarname=$RETRUN
 
    网络下载到目录  ${dl_url}  $dir
    if [ $? -ne 0 ];then
        终端显示 ${bold_red_word}  "下载 ffmpeg 失败"
        return 0
    fi 

    解压tar_xz文件到指定目录  $dir/$tarname  ${dir}

    local filename=$(ls -1 $dir |grep -v "tar.xz" | head -1)


    sudo ln -sf $dir/${filename}/ffmpeg /usr/local/bin/ 
    sudo ln -sf $dir/${filename}/ffprobe /usr/local/bin/  
    sudo ln -sf $dir/${filename}/qt-faststart /usr/local/bin/  

    查询指令路径 ffmpeg     
    if [ $? -eq 0 ];then
        终端显示 ${bold_green_word} "ffmpeg 成功安装"   
        return 0
    else
        终端显示 ${bold_red_word} "ffmpeg 安装失败"
        return 1
    fi
}


function 视频剪切_ffmpeg(){
    local inputfile=
    local outputfile=
    local START_TIME=
    local STOP_TIME=
    
    ffmpeg -i ${inputfile} -ss ${START_TIME} -t ${STOP_TIME} -acodec copy -vcodec copy  ${outputfile}
}

function 视频合并_ffmpeg(){     #格式
    终端显示 ${green_word} "当前工作目录" ${bold_purple_word}  $(pwd)
    
    local filetype="mp4|mkv"

    local firstfile=$(ls -1 |grep -E ".${filetype}$" | head -1)  #只取第一个文件
    local extname=${firstfile##*.}   #扩展名

    #======== 只处理 extname 类型的视频===============
    echo
    终端显示  ${bold_purple_word} "要处理的视频列表："
    ls -1 |grep -E ".${extname}$"  #列出文件
    echo
    捕获用户单次点击按键  "开始合并列表里的 ${extname} 视频-----按任意键继续"
    #=======开始============
    rm ./tmp.txt ; ls -1 |grep -E ".${extname}$"|  xargs -I {}   echo "file '{}'"  | tee -a tmp.txt

    local name=$(ls -1 |grep -E ".${extname}$"| head -1)
    
    #如果中断，删除过程文件
    捕捉CtrlC中断信号后执行  "rm ${name%.*}"_output."${name##*.} ;rm ./tmp.txt "

    ffmpeg -f concat -safe 0 -i  tmp.txt  -c copy   ${name%.*}"_output."${name##*.} 
    
    终端显示 ${green_word} "视频合并完成"  ${purple_word}  ${name%.*}"_output."${name##*.} 
    
    rm ./tmp.txt &>/dev/null

    捕获用户单次点击按键 "视频合并完成，按任意键退出此脚本"
    exit
}


# sudo mount -t   cifs  -o defaults,vers=2.0,rw,iocharset=utf8,uid=1000,gid=1000,username=用户名,password=密码
function 挂载samba目录(){  #密码

    read -p "[samba] 请输入 samba 用户："  samba_user
    echo
    read -sp "[samba] 请输入 samba 密码："  passwd

    sudo mkdir $samba_moutdir
    sudo chown -R $USER $samba_moutdir
    #sudo chmod 755 $samba_moutdir
    sudo sed -i "/$samba_user/d"   /etc/fstab 
    sudo umount $samba_moutdir     #移除之前挂载
    echo "//${samba_ip}/${samba_user}_Home2   $samba_moutdir  \
         cifs  defaults,vers=2.0,rw,iocharset=utf8,uid=1000,gid=1000,username=${samba_user},password=${passwd} 0 0"    \
        | sudo tee -a  /etc/fstab  >/dev/null
    
    systemctl daemon-reload
    sudo mount -a
    终端显示  ${bold_green_word}  "挂载过程结束。" 
 
}

function 安装玲珑管理工具(){
    type -a ll-cli &>/dev/null
    if [ $? -eq 0 ];then
        终端显示  ${bold_red_word}  "玲珑 ll-cli 可用使用"  
    else 
        sudo apt install linglong-builder \ 
                 linglong-box \
                 linglong-dbus-proxy \
                 linglong-bin \
                 linglong-installer
        [ $? -eq 0 ] && 终端显示  ${bold_red_green}  "玲珑 ll-cli 安装完成"   
    fi
}

#=========== 下载护眼主题仓库 ===============================================

function 下载护眼主题仓库lwleen(){
    if [ $USER != 'lwl' ];then
        终端显示  ${bold_blue_word}  "无效选项，保留自用"
        return 1
    fi

    local path=$HOME/.vscode/extensions     #vscode插件路径
    if [ -e $path/lwleen_vscode ];then
        终端显示 ${bold_green_word}  "护眼主题仓库代码已存在"
        return 0   #存在就退出
    fi

    git clone git@gitee.com:lwleen/lwleen_vscode  $HOME/.vscode/extensions/lwleen_vscode --progress --depth 1
    if [ $? -eq 0 ] ;then
        终端显示 ${bold_green_word}  "护眼主题仓库代码下载成功"
            local name=$(ls ${path} | grep "lwleen.lwleen-theme-vscode-plugin" | head -1)  #获取插件名
            [ $name ] &&  sudo rm -rf $path/$name    #删除官方下载的护眼主题插件
            if [ ! -e $path/$name ];then
                终端显示 ${bold_green_word}  "已删除官方下载的护眼主题插件"
                return 0
            fi
    else
        终端显示 ${bold_red_word}  "护眼主题仓库代码下载失败"
        return 2
    fi
}

#=========== 安装彩色表情 ===============================================
function 安装彩色表情(){
    从官方仓库安装软件  fonts-noto-color-emoji
    cat >~/.config/fontconfig/conf.d/01-emoji.conf<<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <alias>
    <family>serif</family>
    <prefer>
      <family>Noto Color Emoji</family>
    </prefer>
  </alias>
  <alias>
    <family>sans-serif</family>
    <prefer>
      <family>Noto Color Emoji</family>
    </prefer>
  </alias>
  <alias>
    <family>monospace</family>
    <prefer>
      <family>Noto Color Emoji</family>
    </prefer>
  </alias>
</fontconfig>
EOF
    fc-cache -f -v
}
 
#=========== python3 ==================================================
function 安装python3(){
    从官方仓库安装软件 python3
    从官方仓库安装软件 python3-pip               #包管理器
    sudo pip3 config set global.index-url  ${python_pipy}  >/dev/null
#     mkdir $HOME/.pip/   &>/dev/null
#     echo >$HOME/.pip/pip.conf  "[global]
# timeout = 6000
# index-url = ${python_pipy}
# trusted-host = ${python_pipy_trusted_host}  "

    [ $? -eq 0 ] && \
    终端显示 ${bold_green_word} "python3-pip 源"    ${bold_purple_word}  ${python_pipy}

    pip3 install pip3 -U                      #升级包管理器
}

#=========== virtualbox ===============================================
function 安装virtualbox(){  #下载网址   #安装位置
    virtualbox --help &>/dev/null
    if [ $? -eq 0 ];then
        终端显示 ${bold_green_word} "virtualbox 已安装"  
        return 0
    fi
    local dl_url=$virtualbox_url
    local dir=$TMP_DIR
    网络下载到目录  ${dl_url}  $dir
    if [ $? -ne 0 ];then
        终端显示 ${bold_red_word}  "下载 vbox 失败"
        return 0
    fi 

    截取路径里文件名 $dl_url
    local vbname=$RETRUN

    sudo chmod u+x ${TMP_DIR}/${vbname}  #给执行权限

    终端显示 ${bold_blue_word} "正在安装 virtualbox ......"  
    sudo ${TMP_DIR}/${vbname}            #执行

    virtualbox --help &>/dev/null
    if [ $? -eq 0 ];then
        终端显示 ${bold_green_word}  "成功安装 virtualbox"
        return 0
    else 
        终端显示 ${bold_red_word}  "安装 virtualbox 失败"
        return 1
    fi 
}



#=========== edge ===============================================
function 安装edge(){
    /opt/microsoft/msedge/msedge --version &>/dev/null
    if [ $? -eq 0 ];then
        终端显示 ${bold_green_word} "edge 已安装，版本："  ${bold_purple_word} "$(/opt/microsoft/msedge/msedge -version)"  
        return 0
    fi

    local dl_url=$edge_url
    local dir=$TMP_DIR
    网络下载到目录  ${dl_url}  $dir
    if [ $? -ne 0 ];then
        终端显示 ${bold_red_word}  "下载 edge 失败"
        return 0
    fi 

    截取路径里文件名 $dl_url
    local edgename=$RETRUN

    终端显示 ${bold_blue_word} "正在安装 edge ......"  
    sudo dpkg -i ${TMP_DIR}/${edgename}   #安装

    /opt/microsoft/msedge/msedge --version &>/dev/null
    if [ $? -eq 0 ];then
        终端显示 ${bold_green_word}  "成功安装 edge"
        return 0
    else 
        终端显示 ${bold_red_word}  "安装 edge 失败"
        return 1
    fi   
    #sudo apt-get -f install        #强制安装
}



#=========== git ===============================================

function 安装git(){
  从官方仓库安装软件 git
  if [ $? -ne 0 ];then
    sudo add-apt-repository ppa:git-core/ppa    #这个是 git 官方仓库
    sudo apt update
    sudo apt install -y git
    查询软件是否已安装 git
    if [ $? -eq 0 ];then
        终端显示 ${bold_green_word}  "成功安装 git"   ${bold_purple_word}  $(git --version) 
    else 
        终端显示 ${bold_red_word}  "安装 git 失败"
    fi   
  fi
}

function 配置gitee用户安全连接(){
    查询软件是否已安装 git
    [ $? -ne 0 ] && return 1    #没有安装git 

    #======== 配置 git 用户====仅供参考==== 
    配置git用户lwleen(){
        local user=$(git config user.name)
        local email=$(git config user.email)
        if [ ! $user ] ||  [ ! $email ] ;then
                git config --global user.name  ${git_user_name}  
                git config --global user.email ${git_e_mail} 
                user=${git_user_name}  
                email=${git_e_mail} 
        elif [ $user != ${git_user_name} ] || [ $email !=  ${git_e_mail}  ]  ;then
            终端显示 ${bold_red_word}  "git 用户信息和设定不一致，当前用户："  ${bold_purple_word}  "${user}  ${email}"
            #read -p "是否改变 git 用户信息? [ 确认/取消  y/n ]" enter
            捕获用户单次点击按键 "是否改变 git 用户信息? [ 确认 y ]"
            if [ $RETRUN == 'y' ];then
                git config --global user.name  ${git_user_name}  
                git config --global user.email ${git_e_mail} 
                user=${git_user_name}  
                email=${git_e_mail} 
            fi
        fi
        终端显示 ${bold_green_word}  "git 用户"   ${bold_purple_word}  "${user}"
        终端显示 ${bold_green_word}  "git 邮箱"   ${bold_purple_word}  "${email}"
    }
    配置git用户lwleen
    
    #配置 gitee ssh通信---------------------------------
    yes "yes" | ssh -T git@gitee.com   &>/dev/null
    if [ $? -eq 0 ];then  
        终端显示  ${bold_green_word}  "代码仓库 gitee.com"  ${bold_purple_word}  "公钥已添加，可以安全连接 "
        return 0
    fi
    #======== 生成 SSH 密钥 ==========
    生成ed25519密钥(){
        if [ -e ~/.ssh/id_ed25519.pub ];then
            终端显示 ${bold_green_word} "SSH 公钥已经存在"
            终端显示  ${red_word}  "$(cat ~/.ssh/id_ed25519.pub)"
        else
            yes ''| ssh-keygen -t ed25519 -C "${git_e_mail}"
            终端显示 ${bold_green_word} "新生成 SSH 公钥："
            终端显示  ${red_word}  "$(cat ~/.ssh/id_ed25519.pub)"
        fi     
    }                      
    生成ed25519密钥

    gitee添加SSH公钥(){
        #===== 进入网页，添加SSH密钥 =======
        #read -p "按回车键打开网页： https://gitee.com/profile/sshkeys  "  enter
        用系统默认应用打开  ${ssh_gitee_url}  

        # 等待  这一步就是等待用户操作完成 主动按确认
        #read -p "将上面显示红色 SSH 公钥添加到网页后，请按回车键，进行下一步  "  enter
        捕获用户单次点击按键 "将上面显示红色 SSH 公钥添加到网页 ${ssh_gitee_url} 后，请按任意键，进行下一步"
    }  
    gitee添加SSH公钥  #调用函数

    yes "yes" | ssh -T git@gitee.com   &>/dev/null  #添加远程主机到本机SSH可信列表
    if [ $? -eq 0 ];then
       终端显示 ${bold_green_word} "gitee 公钥添加成功"
       return 0
    else
       终端显示 ${bold_red_word}  "gitee 公钥添加失败"
       return 2
    fi
}



#=========== nodejs ===============================================

function 安装nodejs(){  #下载网址   #安装位置
    
    #========= 安装 nodejs =========================================
    查询指令路径 node     
    if [ $? -eq 0 ];then
       终端显示 ${bold_green_word} "nodejs 已安装"   ${bold_purple_word}  $(node --version) 
            # 成功安装后，切换 npm 软件源
            if [ $(npm config get registry) != ${nodejs_registry} ];then
                npm config set registry ${nodejs_registry}
            fi
            终端显示 ${bold_green_word} "nodejs npm 加速源"  ${bold_purple_word} "${nodejs_registry}"
       return 0
    fi
    #======== 官网下载包 ============== 
    local dl_url=$1
    local dir=$2

    截取路径里文件名 $dl_url
    local tarname=$RETRUN
 
    网络下载到目录  ${dl_url}  $dir
    if [ $? -ne 0 ];then
        终端显示 ${bold_red_word}  "下载 nodejs 失败"
        return 0
    fi 

    解压tar_xz文件到指定目录  $dir/$tarname  ${dir}
    local filename=$RETRUN

    添加到系统路径 $dir/${filename}/bin
  #  sudo ln -sf ~/nodejs/${filename}/bin/node /usr/local/bin/  
   # sudo ln -sf ~/nodejs/${filename}/bin/npm /usr/local/bin/  
    #====== 验证 nodejs 可用 ===========
    查询指令路径 node 
    if [ $? -eq 0 ];then
        终端显示 ${bold_green_word} "nodejs 安装成功"
            # 成功安装后，切换 npm 软件源
            if [ $(npm config get registry) != ${nodejs_registry} ];then
                npm config set registry ${nodejs_registry}
            fi
            终端显示 ${bold_green_word} "nodejs 软件源"  ${bold_purple_word} "${nodejs_registry}"
        return 0
    else
        终端显示 ${bold_red_word} "nodejs 安装失败"
        return 1
    fi
}



#====== 申请微软密钥 ===============
nodejs模块vsce请输入微软密钥(){
    查询指令路径 vsce
    [ $? -ne 0 ] && return 1    #vsce 安装失败退出
    #判断是否已经登录
    vsce ls-publishers | grep "${vscode_vsce_user}"  &>/dev/null
    if [ $? -eq 0 ];then
        终端显示 ${bold_green_word} "VScode vsce 已经存在登录用户"  ${bold_purple_word} "${vscode_vsce_user}"
        return 0
    fi
    终端显示 ${bold_green_word}  "请在打开的网页里，申请密钥"
    用系统默认应用打开  ${vsce_ms_token} 
    
    vsce login ${vscode_vsce_user} 

    vsce ls-publishers | grep "${vscode_vsce_user}"  &>/dev/null

    if [ $? -eq 0 ];then
            终端显示 ${bold_green_word} "vsce 已经存在登录用户 ${vscode_vsce_user}"
            return 0
        else
            终端显示 ${bold_red_word}  "vsce 用户登录失败"
            return 3
    fi
}


function 安装nodejs模块(){   #模块名
        查询指令路径 node 
        [ $? -ne 0 ] && return 1 # node 未安装

        local module_name="$1"
        $module_name --version &>/dev/null
        if [ $? -eq 0 ];then
            终端显示 ${bold_green_word} "$module_name 模块已安装  "  ${bold_purple_word}   "$(${module_name} --version 2>/dev/null | head -1)" 
            return 0
        else
            终端显示 ${bold_blue_word} "正在安装 $module_name ......"
            npm i -g $module_name 
            
            查询指令路径 node
            local realpath=$RETRUN
          #  echo $realpath
            local dir=${realpath%/*}  # 找到 ~/nodejs/ ..  /bin

            添加到系统路径  $dir
          #  sudo ln -sf $dir/$module_name  /usr/local/bin/  &>/dev/null

            $module_name --version &>/dev/null
            if [ $? -eq 0 ];then
                终端显示 ${bold_green_word} "$module_name 安装成功"
                return 0
            else
                终端显示 ${bold_red_word} "$module_name 安装失败"
                return 2
            fi
        fi
}

 
#=========== mpv ===============================================

function 安装mpv视频播放器(){
    从官方仓库安装软件 mpv
    [ $? -ne 0 ] && return 1    #没有安装成功就退出
    查询软件是否已安装 git
    [ $? -ne 0 ] && return 2  #没有安装git 

    下载mpv配置(){
        if [ -e ~/.config/mpv/mpv.conf ];then
            终端显示 ${bold_green_word} "mpv配置已存在"   ${bold_purple_word}   $HOME"/.config/mpv/mpv.conf"
            return 0
        fi
    
        rm -rf ~/.config/mpv/     #删除原有配置文件夹
        git clone  ${mpv_config_url}  ~/.config/mpv

        if [ $? -eq 0 ];then
                终端显示 ${bold_green_word} "MPV 配置下载成功"
                return 0
            else
                终端显示 ${bold_red_word}  "MPV 配置下载失败"
                return 3
        fi   
    }
    下载mpv配置
}


#=========== nomacs ===============================================

function 安装nomacs图片浏览器(){
    从官方仓库安装软件 nomacs
    [ $? -ne 0 ] && return 1    #没有安装成功就退出
    查询软件是否已安装 git
    [ $? -ne 0 ] && return 2    #没有安装git 

    下载nomacs配置(){
        if [ -e ~/.config/nomacs/'Image Lounge.conf' ];then
            终端显示 ${bold_green_word}  "nomacs配置已存在:"  ${bold_purple_word}   $HOME"/.config/nomacs/Image Lounge.conf"
            return 0
        fi
        
        rm -rf ~/.config/nomacs     #删除原有配置文件夹
        git clone  ${nomacs_config_url}  ~/.config/nomacs

        if [ $? -eq 0 ];then
                终端显示 ${bold_green_word}  "nomacs 配置下载成功"
                return 0
            else
                终端显示 ${bold_red_word}  "nomacs 配置下载失败"
                return 3
        fi  
    }
    下载nomacs配置
}


#=========== nomacs ===============================================

function 安装xdm下载工具(){
    查询指令路径 xdman
    if [ $? -eq 0 ];then
        终端显示  ${bold_green_word} "xdm 已安装"
        return 0
    fi
    local url=$1
    local path=$TMP_DIR/xdm

    截取路径里文件名 $url
    local tarname=$RETRUN

    网络下载到目录  $url  $path
    if [ $? -ne 0 ];then
        终端显示 ${bold_red_word}  "下载 xdm 失败"
        return 0
    fi 

    解压tar_xz文件到指定目录 $path/$tarname  $path
    
    local install=${path}/install.sh
 
    终端显示 ${bold_blue_word} "正在安装 xdm ......"
    sudo chmod u+x $install 
    sudo $install >/dev/null   #执行安装
    终端显示 ${bold_green_word} "已执行安装脚本 $install"
}