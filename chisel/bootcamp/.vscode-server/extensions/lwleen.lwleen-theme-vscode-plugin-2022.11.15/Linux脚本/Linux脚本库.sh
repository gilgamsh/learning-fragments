#!/bin/bash 
#bash - 即 Bourne Again Shell。bash 是 Linux 标准默认的 shell。


#source Linux脚本库.sh  和 . ./Linux脚本库.sh  效果一样    --> 此声明，让当前脚本继承了外部脚本的全局变量和函数 相当于把外部脚本的函数和全局变量导入了当前脚本中
#source ---- 在当前bash环境下读取并执行FileName中的命令

#此脚本作为库脚本，只有函数和变量，供其他脚本使用。
#
#
#========== 说明 ===============
#    1 变量只能用字母
#    2 赋值 = 两边不能有空格
#    3 函数A(){}    --调用-->  函数A
#    4 函数用 $1 $2 ... 传递参数
#    5 函数里局部变量声明 local  否则就是全局变量
#    6 export 声明的临时环境变量，可以被后面创建 shell 进程调用
#    7 慎用 空格 ，会发生意外
#    8 $() 是执行括号内的指令
#    9 ${} 是替换
#    10  成功 true 是0   失败 false 是非0    
#    11  return只能是整数---->return 0 表示成功   非零即是各种各样的失败，类似错误码
#    12  返回值 $? 只对上一条指令负责， 紧跟在指令后，且只能使用一次
#    13 函数体里不能为空，至少有一条指令，否则报错
#
# 范例 自动化脚本
# ssh-keygen -t ed25519 -C "lwleen@qq.com" -f ~/.ssh/git_ed25519<<EXSU
# test
# ''
# ''
# EXSU


#-----------------全局变量 用于传递函数返回值--------------------------------------------
RETRUN=   #用于函数返回   只在调用函数后临时有效
RETRUN_1=  #用于函数返回第二个



#================== 此脚本当做库用 下面全部都是函数 =======================================





#----------------分割线---------------------基础指令------------------------------------
function 终端显示(){  #颜色 #第一个字符串   #颜色 #第二个字符串  #控制是否显示 --> 
    if [ -z "$5" ] && [ "$4" != '' ];then
        echo -e   "\033[${1}m${2} \033[0m" "-->"  "\033[${3}m ${4} \033[0m"
    elif  [ ! -z "$5" ] && [ "$4" != '' ];then
        echo -e   "\033[${1}m${2} \033[0m"   "\033[${3}m ${4} \033[0m"
    else 
        echo -e   "\033[${1}m${2} \033[0m" 
    fi
}

function 用系统默认应用打开(){  #文件  或  网址
    xdg-open  $1  &> /dev/null
}

function 添加到系统路径()    #目录  将目录下所有成员链接到 /usr/local/bin/
{
    local dir=$1 ;echo $dir
    ls -1  $dir | xargs -I {}   sudo ln -sf  ${dir}/{}  /usr/local/bin/
    # 去除重复路径(){        #路径
    #     case ":$PATH:" in
    #             *:"$1":*)
    #                 ;;
    #             *)
    #                 PATH="${PATH:+$PATH:}$1"
    #         esac
    # }
    # 去除重复路径 $1
    # unset -f 去除重复路径
    # export PATH
}




function 脚本添加为新指令(){  #脚本路径   #新指令名
    if [ -z "$1" ];then
        return 1
    else
        sudo ln -sf ${1}  /usr/local/bin/$2     #将脚本添加到系统可执行程序  /usr/local/bin目录是给用户放置自己的可执行程序的地方，推荐放在这里，不会被系统升级而覆盖同名文件
        return 0
    fi 
}
function 删除脚本指令(){   #新指令名
   sudo rm /usr/local/bin/$1
}


function 随机数(){  #位数
    RETRUN=$[RANDOM]
}
#随机数 2   --->生成两位随机数


function 截取右边字符串_第一个(){  #字符串   #字符   
    RETRUN=${1##*${2}}   
}
#截取右边字符串_第一个 'abc/def/123'  '/'  ---> 123

function 截取右边字符串_所有(){  #字符串   #字符  
    RETRUN=${1#*${2}} 
}
#截取右边字符串_所有   'abc/def/123' '/' ---> abc/def/123

function 截取左边字符串_第一个(){
    RETRUN=${1%%${2}*} 
}
# 截取左边字符串_第一个 'abc/def/123' '/' ---> abc

function 截取左边字符串_所有(){   #字符串   #字符 
    RETRUN=${1%${2}*} 
}
# 截取左边字符串_所有 'abc/def/123'  '/' ---> abc/def



function 截取路径里文件名(){    #网址(包含文件名)
    截取右边字符串_第一个 "${1}" '/'
    RETRUN=$RETRUN
}
#截取路径里文件名 '/abc/def/123.img'  '/' ---> 123.img

function 截取路径的目录(){   #文件路径(包含文件名)
    截取左边字符串_所有 "${1}" '/'    
    RETRUN=$RETRUN
}
#截取路径的目录 '/abc/def/123.img'   '/' ---> /abc/def



#脚本库路径  ~/test/库脚本.sh    ./111/124.conf
function 拼接绝对路径和相对路径(){  #脚本库路径   #配置文件相对路径
    截取路径的目录 $1
    local dir=$RETRUN     #-> ~/test

    截取右边字符串_所有 $2 '/'   #-> 111/124.conf
    local rlpath=$RETRUN
    
    RETRUN=${dir}/${rlpath}  #拼接绝对路径 和 相对路径  ~/test/111/124.conf
}






function 关闭进程(){ # 进程名
    ps aux|grep ${1}|grep -v grep|awk '{print $2}'|xargs kill -9
}               # 会列出 grep 自身，所以 -v 反选去掉自己


function 查询是否有进程(){  # 进程名
    if [ $(ps aux|grep $1|wc -l) ] ;then
        return 0
    else
        return 1
    fi 
}
#查询是否有进程 fcitx

# SIGINT   Ctrl+C 发出的程序终止(interrupt)信号   捕获信号后执行 exit 命令
# SIGCHLD  子进程结束时, 父进程会收到这个信号
function 捕捉CtrlC中断信号后执行(){ #执行的脚本
    trap  "$1"  SIGINT
}

function 从软链接找到真实地址(){  #软连接
    local path2=$(ls -l ${1} |grep -e '->' | head -1 )  #查找软链接对应的  
    if [ -z "${path2}" ];then
       RETRUN=''         #这种是没有链接的内部指令
       return 1
    else 
        截取右边字符串_第一个 "$path2"  '-> '   # $path2 不是字符串 ,加引号转成字符串
        RETRUN=$RETRUN    #指令真实文件所在路径
        return 0
    fi
}
#从软链接找到真实地址 /usr/bin/mpv  ---->找到实际安装文件地址里的mpv 路径

function 查询指令路径(){  #指令名    --->只返回两种状态，找到 或没找到
    type -a $1 &>/dev/null       # a 所有可能的指令   替代  whereis 
    if [ $? -eq 0 ];then
        #软链接的真实地址
        local ln_path=$(type -p $1 | head -1 )  # p 只针对外部指令 
        从软链接找到真实地址 $ln_path
        if [ $? -eq 0 ];then
            RETRUN=$RETRUN    #指令真实文件所在路径
            RETRUN_1=$ln_path
        else 
            RETRUN=''         #这种是没有链接的内部指令
            RETRUN_1=$ln_path
        fi
        return 0  #只要找到指令路径 就存在
    else
        return 1  #指令不存在
    fi 
}
#查询指令路径 git       #会查询是否有此指令，有则用 RETURN 指令路径

function 在仓库里搜索软件(){ #软件包名字
    apt search $1 2>/dev/null | grep -e ^${1}/  &>/dev/null    #grep 找不到返回1
}   
#在仓库里搜索软件 git

function 查找本地软件(){  #软件名 
    dpkg -s $1 &>/dev/null     #找不到返回1
    
}   

#返回：0(已安装)   1(远程仓库有)  2(无此软件)
function 查询软件是否已安装(){  #软件名 
    local name=$1
    查找本地软件 $name            #会查询是否有此指令
    if [ $? -eq 0 ] ;then       #已经安装
        return 0
    else
        在仓库里搜索软件 $name
        if [ $? -eq 0  ];then   #远程有
            return 1
        else
            return 2            #都没有
        fi
    fi
}
#查询软件是否已安装 git

function 系统仓库安装软件(){ #软件包名字  #软件包名字  ....
    for name in $*
    do
        sudo apt install -y $name
    done
}
#系统仓库安装软件 mpv git






#----------------分割线----------------------可用函数-----------------------------------------




function 从官方仓库安装软件(){  #软件名
    local name=$1
    查询软件是否已安装 $name
    local err=$?
    if [ $err -eq 0 ];then
       终端显示 ${bold_green_word} "$name 已安装"   ${bold_purple_word}  "$(${name} --version 2>/dev/null | head -1)" 
       return 0
    elif [ $err -eq 1 ];then
       终端显示 ${bold_blue_word} "正在安装 $name ......"
       系统仓库安装软件 $name
       查询软件是否已安装 $name
       if [ $? -eq 0 ] ;then
            终端显示 ${bold_green_word}  "成功安装 $name "  
            return 0
        else
            return 2
        fi
    else 
        终端显示 ${bold_red_word}  "无法找到软件 $name ，请添加仓库源！"
        return 1
    fi
}
#从官方仓库安装软件  git

function 网络下载到目录(){  #下载文件网址  #目录
    截取路径里文件名 $1
    local name=$RETRUN
    #是否已经下载
    local file=${2}/${name} #完整路径
    if [ -e $file ];then    #文件是否已经存在
        终端显示 ${bold_green_word} "网络下载的文件已经存在"  ${bold_purple_word}  "$file"
        return 0
    else
        终端显示 ${bold_blue_word}  "正在下载 $1 ......"
        mkdir $2 &>/dev/null
        wget --no-check-certificate -cP $2  $1      # c 断电续传  x创建目录 P保存到文件夹 O是下载后的文件命名
        if [ $? -eq 0 ];then
            终端显示 ${bold_blue_word}  "下载完成，已保存"   ${bold_purple_word}   "$file"
           return 0
        else
            终端显示 ${bold_red_word}  "下载失败 $1 "
           return 1
        fi
   fi
}
#网络下载到目录 "http://www.123.com/123.txt"  ~/tmp/
 

function 解压tar_xz文件到指定目录(){  #文件路径(包含文件名)   #解压到目录
    截取路径里文件名 $1
    local name=$RETRUN

   # tar -xf $1   -C $2  --strip-components 1  # 解压时从文件名中清除 NUMBER 个引导部分   1 即所有文件夹里内容 解压
    终端显示 ${bold_blue_word} "正在解压文件 $1 ......"
    tar -xf $1   -C $2      
    if [ $? -eq 0 ];then
        终端显示 ${bold_green_word}  "解压完成，保存在 $2"
        RETRUN=${name%.tar.xz*}     #返回解压后的文件名 ,去掉扩展名
       return 0
    else
        终端显示 ${bold_red_word} "解压失败 $1"
       return 1
    fi
}  
#解压tar_xz文件到指定目录  ~/tmp/123.tar.xz  ~/tmp/


function 获取用户权限(){    
    ########是否已经获得权限
        timeout 1s  sudo -n echo  &> /dev/null     #-n 非交互模式  -S从标准输入读取密码
        if [ $? -eq 0 ];then
            echo -e "\033[1;37;42m 已有用户权限 \033[0m \n"
            return
        fi
        #下面是为获得权限，要求输入密码
        read -sp "[sudo] $USER 请输入密码："  passwd

        timeout 1s   echo ${passwd} | sudo -S echo  &> /dev/null 
        if [ $? -eq 0 ];then   
                密码写入临时文件(){  #密码(参数)
                    echo -e "#!/bin/bash \n echo ${1} \n"> /tmp/._pw_
                    echo ${1} | sudo -S chmod +x /tmp/._pw_   #可执行权限
                    export SUDO_ASKPASS=/tmp/._pw_

                    sudo -A echo  &>/dev/null
                    if [ $? -eq 0 ];then
                        echo -e "\033[1;37;42m  密码正确，已获得用户权限 \033[0m \n"
                        
                        trap "sudo rm /tmp/._pw_;exit"  EXIT  #捕捉到脚本退出信号后 删除 /tmp/._pw_

                        return 0
                    else
                        echo -e "\033[1;37;41m  密码错误! \033[0m"
                        获取用户权限
                    fi
                    #下面全部使用 sudo -A
                }   #此函数未调用，留着备用
                echo -e "\033[1;37;42m  密码正确，已获得用户权限 \033[0m \n"
                return 0
        else
            echo -e "\033[1;37;41m 密码错误! \033[0m"
            获取用户权限
        fi
        #######################
}




# 可以创建一个 123.img 并挂载到目录， 这个目录下所有文件夹都在 123.img中

function 创建镜像文件(){  #镜像路径(包含文件名） #大小(单位 M)
    if [ -e $1 ];then
        终端显示 ${bold_green_word}  "镜像已经存在 $1"
        return 0
    else 
        截取路径的目录 $1
        mkdir $RETRUN  #创建文件夹

        sudo dd if=/dev/zero of=$1  bs=1024k count=0 seek=$2
        if [ $? -eq 0 ];then
            终端显示  ${bold_green_word} "创建镜像成功 $1"
            return 0
        else
            终端显示 ${bold_red_word}  "错误，无法创建镜像"
            return 1
        fi
    fi
}
#创建镜像文件 ~/tmp_lwl/123.img  30

function 格式化镜像为ext2(){ #镜像路径   
    截取路径里文件名 $1
    local name=$RETRUN


    sudo mkfs.ext2 -F -m 0 -L $name  $1
    if [ $? -eq 0 ];then
        终端显示 ${bold_green_word}  "格式化镜像成功 $1"
        return 0
    else
        终端显示 ${bold_red_word}  "错误，无法格式化镜像"
        return 1
    fi
}  
#格式化镜像为ext2 ~/tmp_lwl/123.img 

function 挂载镜像(){   #镜像路径  #挂载路径
    mkdir $2
    sudo mount -o loop -t ext4 $1 $2  
}
#挂载镜像 ~/tmp_lwl/123.img  ~/tmp_lwl/123

function 卸载镜像(){  #镜像路径
   sudo umount $1
}
#卸载镜像 ~/tmp_lwl/123.img 


function 查找脚本绝对路径(){  #此脚本路径  即 $0       #如果参数是相对路径，那么只能用当前脚本目录来合成
        local path=$0
        local realpath=
        截取左边字符串_第一个 "$path"  '/'
        if [ "$RETRUN" == '.' ];then    #在相对路径里调用的脚本
            截取右边字符串_所有 "$path" '/'
            local rlpath=$RETRUN
            realpath=$(pwd)/$rlpath   #合成绝对路径

            截取左边字符串_所有 "$realpath" '/'   #获取父路径
            RETRUN_1=$RETRUN  
            RETRUN=$realpath
            return 0
        else
            从软链接找到真实地址 $path
            if [ $? -eq 0 ];then   #找到的是软链接
                realpath=$RETRUN    
                截取左边字符串_所有 "$realpath" '/'   #获取父路径
                RETRUN_1=$RETRUN  
                RETRUN=$realpath
                return 0
            else
                realpath=$0    #本身就是绝对路径
                截取左边字符串_所有 "$realpath" '/'   #获取父路径
                RETRUN_1=$RETRUN  
                RETRUN=$realpath
                return 0
            fi
        fi   
} 
#查找绝对路径 ./test.sh  ---> /home/lwl/test.sh  



function 加载配置(){  #配置绝对路径
    source $1
}


function 显示进度条()
{
  echo -e "这里是进度条"
}

function 询问修改配置文件(){
        终端显示 ${bold_blue_word}  "使用前，请修改配置文件："  ${bold_purple_word} "${CONF_PATH}"  1
        终端显示 ${bold_red_word} "默认为我的个人配置，不修改的的话会出大麻烦。"
        echo 
        捕获用户单次点击按键  "要打开配置文件吗？ 【 确认请输入 y 】 "
        [  $RETRUN == 'y' ] && code -r ${CONF_PATH}     #只有y键才会打开配置
        
        捕获用户单次点击按键 "你修改配置文件了吗？继续运行此脚本吗？ 【 确按回车键 】 "
        [  $RETRUN != '回车键' ] && exit 1     #按所有非 y  都会退出脚本
}    

function 捕获用户单次点击按键(){   #提示输入
    echo -e "${1}\c"                    #不换行
    local old_tty_settings=$(stty -g)   # 保存老的设置 
    stty -icanon                        # 关闭icanon选项  icanon选项是控制tty的Ctrl-H，Ctrl-W，Ctrl-U功能的
    local Keypress=$(head -c1)          # 或者使用$(dd bs=1 count=1 2> /dev/null)
    echo
    stty "$old_tty_settings"      # 恢复老的设置
    if [ ! $Keypress ];then       # 回车键  即空
        Keypress="回车键"
    fi
    RETRUN=$Keypress
    return 0
}



function 安装玲珑应用(){  # 安装包名
    local appname=$1
    ll-cli list 2>/dev/null  | grep  "${appname}\s"  &>/dev/null  #查询是否安装
    if [ $? -eq 0 ];then
        终端显示  ${bold_green_word} "${appname}已经安装"
    else
            ll-cli query $appname  &>/dev/null
            if [ $? -ne 0  ];then
                终端显示  ${bold_red_word} "玲珑仓库里不存在安装包 ${appname}"
            else
                ll-cli install  $appname
                终端显示  ${bold_green_word} "成功安装 ${appname}"
            fi
    fi

}