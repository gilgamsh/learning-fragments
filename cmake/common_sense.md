<!--
 * @Date: 2022-07-09 09:50:31
 * @LastEditors: Juan Jiang
 * @LastEditTime: 2022-07-09 09:56:39
 * @FilePath: \learning-fragments\cmake\common_sense.md
-->

使用现代的CMake(3.21+)


### 安装CMake

pip or conda

### 运行CMake

```bash
# 第一种做法
mkdir build
cd build
cmake ..
make

# 第二种做法
cmake -S . -B build
cmake --build build

```