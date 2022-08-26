#!/bin/bash 

#   xdg-open 用默认应用打开
#   xdg-mime default mpv.desktop video/mp4   设置默认应用
#   xdg-mime query default image/png  查询默认应用
#   cat ~/.config/mimeapps.list
#   xdg-mime query filetype tmp.txt  查询某文件类型
#   x-terminal-emulator -w /tmp      打开终端
#
#   sudo apt update&&sudo apt dist-upgrade -y 
#
#   mount--bind /opt/media/wwwroot /opt/wwwroot   将前一个目录挂载到后一个目录上，所有对后一个目录的访问其实都是对前一个目录的访问。
#
#   
#
#

#=========== 变量 用于存储 当前脚本绝对路径=========================
#  $HOME   用户目录 
SCRIPT_DIR=       #脚本所在目录
SCRIPT_NAME=      #脚本所在名字


function 脚本启动_获取权限(){    
        ########是否已经获得权限
        timeout 1s  sudo -n echo  &> /dev/null     #-n 非交互模式  -S从标准输入读取密码
        if [ $? -eq 0 ];then
            echo -e "[sudo] $USER 请输入密码：\c"
            echo -e "\033[1;32m已有用户权限 \033[0m"
            return
        fi
        #下面是为获得权限，要求输入密码
        read -sp "[sudo] $USER 请输入密码："  passwd

        timeout 1s   echo ${passwd} | sudo -S echo  &> /dev/null 
        if [ $? -eq 0 ];then   
                密码写入临时文件(){  #密码(参数)
                    echo -e "#!/bin/bash \n echo ${1} "> /tmp/._pw_
                    echo ${1} | sudo -S chmod +x /tmp/._pw_   #可执行权限
                    export SUDO_ASKPASS=/tmp/._pw_

                    sudo -A echo  &>/dev/null
                    if [ $? -eq 0 ];then
                        echo -e "\033[1;32m  密码正确，已获得用户权限 \033[0m"
                        
                        trap "sudo rm /tmp/._pw_;exit"  EXIT  #捕捉到脚本退出信号后 删除 /tmp/._pw_

                        return 0
                    else
                        echo -e "\033[1;31m  密码错误! \033[0m"
                        脚本启动_获取权限
                    fi
                    #下面全部使用 sudo -A
                }   #此函数未调用，留着备用
                echo -e "\033[1;32m  密码正确，已获得用户权限 \033[0m"
                return 0
        else
            echo -e "\033[1;31m 密码错误! \033[0m"
            脚本启动_获取权限
        fi
        #######################
}

function 将此脚本设为系统指令(){  
    sudo ln -sf ${SCRIPT_DIR}/${SCRIPT_NAME}   /usr/local/bin/${cmdname}    #自定义指令 
    终端显示 ${bold_blue_word} "此脚本已添加为系统指令"  ${bold_purple_word} "${cmdname}"
    ls -l  /usr/local/bin | grep ${SCRIPT_NAME} | awk '{print $9 $10 $11}'
    #删除脚本指令  ${cmdname}                      #删除 自定义指令
}

function 启动加载脚本库和配置(){  #此脚本路径  

    脚本启动_查找路径的绝对路径(){  #路径
        # lwl 指令调用时     $1 =  /usr/local/bin/lwl   是软链接
        # ./配置Linux.sh    $1 = ./配置Linux.sh
        # 绝对路径执行        $1 = 绝对路径
        ###### 查找脚本的绝对地址
        local path=$1
        local var=
        var=${path%%/*}                 # ./test/dd   截取 .    判断是不是相对路径
        if [ "$var" == '.' ];then     
            var=${path#*/}              # ./test/dd   截取  test/dd 
            path=$(pwd)/$var            # 目录和相对路径--->合成绝对路径
            SCRIPT_DIR=${path%/*}       # /home/123.txt   截取  /home
            SCRIPT_NAME=${path##*/}     # /home/123.txt   截取  123.txt
            return 0
        else
            local path2=$(ls -l ${path} |grep -e '->' | head -1 )  #判断是不是链接
            if [ ! -z "${path2}" ];then
                var=${path2##*-> }        # ./test/dd -> /home/123.txt  截取    /home/123.txt          
                SCRIPT_DIR=${var%/*}      # /home/123.txt    截取  /home
                SCRIPT_NAME=${var##*/}     # /home/123.txt   截取  123.txt
                return 0
            else 
                SCRIPT_DIR=${path%/*}     # /home/123.txt     截取  /home
                SCRIPT_NAME=${path##*/}     # /home/123.txt   截取  123.txt
                return 0
            fi
        fi   
    ######完成  查找脚本的绝对地址
    }

    脚本启动_查找路径的绝对路径 $1                           
    source ${SCRIPT_DIR}/Linux脚本库.sh                     #调用脚本库，这样就可以使用里面的函数和变量了
    source ${SCRIPT_DIR}/lwleen.conf   
    source ${SCRIPT_DIR}/Linux软件.sh
    #  ${SCRIPT_DIR}/${SCRIPT_NAME}                        #此脚本路径
}



function 需权限无参运行(){
    询问修改配置文件
    #==========确认继续运行====================================
    安装玲珑管理工具
    安装git                                      
    配置gitee用户安全连接   
    #=========安装软件=======================================
    export PS3="请选择安装软件："
    select slt in   '退出此脚本' \
                    "挂载samba" \
                    "下载护眼主题git仓库"  \
                    '安装 vscode 相关软件' \
                    "安装软件 mpv nocacs Vbox edge xdm..." \
                    "安装软件 qbittorrent qq音乐 迅雷 uget" \
                    "安装彩色表情"  \
                    '安装ffmpeg'  \
                    
    do
        case $slt in
            "退出此脚本")
                break
            ;;
            "挂载samba")
                挂载samba目录
                #ls -l  /usr/local/bin | awk '{print $9 $10 $11}'
                echo
            ;;
            "下载护眼主题git仓库")
                yes "yes" | ssh -T git@gitee.com   &>/dev/null
                if [ $? -ne 0 ];then   
                    终端显示 ${bold_red_word} "gitee之间的安全通道未连接"
                fi
                下载护眼主题仓库lwleen
                echo
            ;;
            '安装 vscode 相关软件')
                安装nodejs $nodejs_url  $node_install_path
                安装nodejs模块  vsce 
                nodejs模块vsce请输入微软密钥
                安装nodejs模块  electron-forge        # 依赖 rpm
                npm config set registry=https://registry.npm.taobao.org
                npm config set sass_binary_site=https://npm.taobao.org/mirrors/node-sass/
                npm config set ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/
                echo
            ;;
            "安装软件 mpv nocacs Vbox edge xdm...")
                type -a apt &>/dev/null 
                if [ $? -ne 0 ];then
                    终端显示 ${bold_red_word} "此系统不是支持的操作系统类型!"
                    exit 1
                fi
                安装python3
                从官方仓库安装软件 qbittorrent
                安装mpv视频播放器
                安装nomacs图片浏览器
                安装edge
                安装virtualbox
              #  从官方仓库安装软件 krita
                从官方仓库安装软件 gimp
                安装xdm下载工具 $xdm_url
                从官方仓库安装软件 rpm                  # electron-forge 打包应用 
                从官方仓库安装软件 putty
                
                终端显示 ${bold_green_word} "设置文件默认启动程序 mpv nomancs"
                # x-terminal-emulator    打开默认终端
                # 设置默认程序  xdg-mime query filetype  查询
                xdg-mime default mpv.desktop video/mp4  
                xdg-mime default mpv.desktop video/x-matroska    #mkv
                xdg-mime default nomacs.desktop image/png
                xdg-mime default nomacs.desktop image/jpeg
                echo
            ;;
            "安装软件 qbittorrent qq音乐 迅雷 uget")
                type -a ll-cli &>/dev/null 
                if [ $? -eq 0 ];then
                    安装玲珑应用 org.qbittorrent.qbittorrent
                    安装玲珑应用 com.qihoo.360zip            #压缩包
                    安装玲珑应用 com.xunlei.download         #迅雷
                    安装玲珑应用 com.qq.music
                    安装玲珑应用 com.qq.weixin.work.deepin   #q企业微信
                else
                    终端显示 ${bold_red_word}  "此系没有安装玲珑!"
                fi
            ;;
            "安装彩色表情")
                安装彩色表情
            ;;   
            "安装ffmpeg")
                安装ffmpeg $ffmpeg_url  $ffmpeg_install_path
            ;;   
        esac
    done
}

function 需权限有参运行(){  
    #echo "脚本有参数: " "$*" 
    echo
    
 
}

function 无需权限有参运行(){
    #echo "脚本有参数: " "$*"

    case $1 in  
        "合并")   #  lwl 合并
            视频合并_ffmpeg
        ;;
        "测试")
        终端显示 ${bold_red_word} "测试"
        ;;   
     esac
}


function 无需权限无参运行(){
    echo

}




function 运行脚本(){  
    type -a apt &>/dev/null     ; local atpreturn=$?
    type -a ll-cli &>/dev/null  ; local llreturn=$?
    if [ $atpreturn -ne 0 ] && [ $llreturn -ne 0  ]  ;then
        echo  -e "\033[1;37;41m 此系统不是支持的操作系统类型! \033[0m"
        exit 1
    fi

    local script_file=$0              #当前脚本路径
    启动加载脚本库和配置  $script_file

    #自用，其他用户退出
    if [ $USER != 'lwl' ];then
         echo  -e "\033[1;37;41m 自用脚本，会安装软件覆盖系统配置，谨慎使用，仅供参考! \033[0m"
         echo  -e "\033[1;35m ${SCRIPT_DIR}/${SCRIPT_NAME}  \033[0m \n"
         exit 1
    fi

    #=========准备就绪=======================================
    echo  -e "\033[1;37;35m欢迎！！！\033[0m"
    终端显示 ${bold_blue_word} "当前脚本路径"   ${bold_purple_word}  ${SCRIPT_DIR}/${SCRIPT_NAME}
    echo

    [ $# -eq 0 ] && 无需权限无参运行 ||  无需权限有参运行 $*

    脚本启动_获取权限
    echo
    将此脚本设为系统指令  
    echo "--------------------------------------------------------"
    echo
    [ $# -eq 0 ] && 需权限无参运行 ||  需权限有参运行 $*
}

#=========== 入口 运行脚本===============================================
# $0 是脚本路径
# $#参数总数
# $1 ... $n 参数
# $* 行打印所有参数
# $@ 列打印所有参数

运行脚本 $* 


















