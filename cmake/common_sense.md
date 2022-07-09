<!--
 * @Date: 2022-07-09 09:50:31
 * @LastEditors: Juan Jiang
 * @LastEditTime: 2022-07-09 17:39:02
 * @FilePath: \learning-fragments\cmake\common_sense.md
-->

使用现代的CMake(3.21+)

### 安装CMake

pip or conda

### 运行CMake

1. 使用命令行

```bash
# 第一种做法
mkdir build
cd build
cmake ..
make

# 第二种做法
cmake -S . -B build # -S 指明Sourse Dir -B 指明 Build Dir
cmake --build build #   --build <dir> (dir 通常是 Build)  Build a CMake-generated project binary tree

```

2. 使用GUI

Vscode 的 **CMake Tools** 插件可以 Build Install Debug。总之就是很好用。

### 基础知识

可以将命令看成是函数 

```cmake
cmake_minimum_required(VERSION 3.0) # 设置CMake的最小版本
cmake_policy(VERSION ${CMAKE_MAJOR_VERSION}.${CMAKE_MINOR_VERSION}) # 设置CMake的版本

# 创建一个项目
project(MyProject VERSION 1.0 
                  DESCRIPTION "Very nice project"
                  LANGUAGES CXX)

add_executable(one two.cpp three.h) # 创建一个可执行文件
add_library(one STATIC two.cpp three.h) # 创建一个库


```

#### 最低版本要求

```cmake
cmake_minimum_required(VERSION 3.1) 
# cmake_minimum_required 是命令 不区分大小写 通常小写 可以看成一个函数
# VERSION 是这个函数的关键字
# 3.1 是版本号  版本号可以声明为一个范围，例如 VERSION 3.1...3.15 实际上就是设置 CMake 版本是3.1
```

通常这么写

```cmake
cmake_minimum_required(VERSION 3.7...3.21)

if(${CMAKE_VERSION} VERSION_LESS 3.12)
    cmake_policy(VERSION ${CMAKE_MAJOR_VERSION}.${CMAKE_MINOR_VERSION}) # 使用 cmake_policy 函数来设置 CMake 版本
endif()
# 如果 CMake 的版本低于3.12，if 块条件为真，CMake 将会被设置为当前版本。
# 如果 CMake 版本是 3.12 或者更高，if 块条件为假，将会遵守 cmake_minimum_required 中的规定 是3.7，程序将继续正常运行。
```

#### 设置一个项目

```cmake
project(MyProject VERSION 1.0 
                  DESCRIPTION "Very nice project"
                  LANGUAGES CXX)
# MyProject 是项目名称
# VERSION 是项目版本 VERSION 设置了一系列变量，例如 MyProject_VERSION 和 PROJECT_VERSION

```

#### 生成一个可执行文件

```cmake
add_executable(one two.cpp three.h) # 创建一个可执行文件 one 。 one 既是生成的可执行文件的名称，也是创建的 CMake 目标(target)的名称
#  two.cpp three.h 是源文件的列表
```

#### 生成一个库

```cmake
add_library(one STATIC two.cpp three.h) # 创建一个库 one 是静态库 STATIC 库类型也可以是 SHARED , MODULE
```

#### 为目标增加依赖
    
```cmake
target_include_directories(one PUBLIC include) # 为目标one 增加了一个依赖的目录

add_library(another STATIC another.cpp another.h)
target_link_libraries(another PUBLIC one) # 为目标another 增加了一个依赖关系
```

#### 小结1 

```cmake
cmake_minimum_required(VERSION 3.8)

project(Calculator LANGUAGES CXX)

add_library(calclib STATIC src/calclib.cpp include/calc/lib.hpp)
target_include_directories(calclib PUBLIC include)
target_compile_features(calclib PUBLIC cxx_std_11)

add_executable(calc apps/calc.cpp)
target_link_libraries(calc PUBLIC calclib)
```

#### 变量与缓存