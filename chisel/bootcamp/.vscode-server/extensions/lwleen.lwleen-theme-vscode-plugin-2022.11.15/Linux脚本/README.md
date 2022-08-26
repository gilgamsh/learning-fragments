

## 静态文件服务器

使用简单，需要nodejs环境。
安装：npm install anywhere -g
使用：anywhere --help
在任何需要访问静态文件的地方，直接运行即可访问：anywhere -p 8080













# linux git 配置

```sh
#==== git 免密下载使用方式 =============
git clone git@gitee.com:lwleen/vs  ~/.vscode/extensions/lwleen-theme
```
### 完成下面的 git 配置才能免密下载推送

```sh
#======== 安装 git ==============  
sudo apt install git -y  

#======== 配置 git ====仅供参考==== 
git config --global user.name  "一切时空过去未来"  
git config --global user.email  "lwleen@qq.com"

#======== 生成 SSH 密钥 ==========
ssh-keygen -t ed25519 -C "lwleen@qq.com" 
cat ~/.ssh/id_ed25519.pub

#===== 进入网页，添加SSH密钥 =======
xdg-open https://gitee.com/profile/sshkeys


#===== 最后验证 git 可用 ==========
ssh -T git@gitee.com     
```

# 安装 nodejs

```sh
# xdg-open   https://nodejs.org/zh-cn/download/ 

#======== 官网下载包 ============== 
url=https://nodejs.org/dist/v16.16.0/node-v16.16.0-linux-x64.tar.xz
dir=~/Desktop/
wget -O  ${dir}/nodejs.tar.xz  ${url}   

#======== 解压包 ================== 
mkdir ${dir}/nodejs && tar -xf  ${dir}/nodejs.tar.xz -C ${dir}/nodejs --strip-components 1

mv ${dir}/nodejs  ~/nodejs  && rm ${dir}/nodejs.tar.xz
sudo ln -s ~/nodejs/bin/node /usr/local/bin/  
sudo ln -s ~/nodejs/bin/npm /usr/local/bin/  
#====== 验证 nodejs 可用 ===========
node -v 

#====== 安装vscode管理 vsce ========
npm i vsce -g
sudo ln -s ~/nodejs/bin/vsce /usr/local/bin/
#====== 验证 vsce 可用 =============
vsce -V

```

```sh
#===== 使用 nodejs  =============
cd 目录
npm i axios    # 安装
npm s axios    # 搜索

```
# git 推送  
```sh
#==== 依然是上面格式，才能免密推送=====
git add . ; git commit -m 备注; git push origin master
```

# 安装 mpv  nomacs  视频 & 图片浏览器  
```sh
#==== 安装软件 mpv nomacs gimp =====
sudo apt install -y  mpv nomacs gimp   
#======== 从仓库里下载配置 ==========
git clone git@gitee.com:lwleen/mpv  ~/.config/mpv  
git clone git@gitee.com:lwleen/nomacs  ~/.config/nomacs
```

# qbittorrent 下载
```
sudo apt install qbittorrent -y  
```




```sh
#=======ncdu查看目录占用==================================
sudo apt install ncdu
sudo ncdu /

```