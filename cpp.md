##### O2

```c++
#pragma GCC optimize(2)
```

##### stoi 和atoi

```c++
stoi（字符串，起始位置，n进制），将 n 进制的字符串转化为十进制 string to integer
 
示例：
stoi(str, 0, 2); //将字符串 str 从 0 位置开始到末尾的 2 进制转换为十进制
ascii to integer
atoi()的参数是 const char* ,因此对于一个字符串str我们必须调用 c_str()的方法把这个string转换成 const char*类型的,而stoi()的参数是const string*,不需要转化为 const char*；
```

##### cin

```
cin读入时会忽略换号和空格 制表符 但是不会删掉读入数据后面的那个换行符
getchar可以读掉换行符
getline会读取直到换行符  并把换行符删掉
```



##### puts

```c++
int puts(const char *s);
//系统会自动在其后添加一个换行符
```

##### scanf

读入字符时 不会忽略空格 读入字符串时会

需要使用字符串来读字符

##### mod

负数%正数 得到负数 c++是这样 数学上余数应该都是正数

(x % N + N)%N

##### memset

```c++
memset(h,0,size(h));
memset(h,-1,size(h));//最为常用的两种

void* memcpy( void* dest, const void* src, std::size_t count );
```

strcpy和memcpy主要有以下3方面的区别。

1、复制的内容不同。[strcpy](https://baike.baidu.com/item/strcpy)只能复制[字符串](https://baike.baidu.com/item/字符串)，而memcpy可以复制任意内容，例如[字符数组](https://baike.baidu.com/item/字符数组)、整型、[结构体](https://baike.baidu.com/item/结构体)、类等。

2、复制的方法不同。strcpy不需要指定长度，它遇到被复制字符的串结束符"\0"才结束，所以容易溢出。memcpy则是根据其第3个参数决定复制的长度。

3、用途不同。通常在复制字符串时用strcpy，而需要复制其他类型数据时则一般用memcpy。

##### 枚举类型

```c++
enum <类型名> {<枚举常量表>};
enum color_set1 {RED, BLUE, WHITE, BLACK};
color3=RED;           //将枚举常量值赋给枚举变量
color4=color3;        //相同类型的枚举变量赋值，color4的值为RED
int  i=color3;        //将枚举变量赋给整型变量，i的值为1
int  j=GREEN;         //将枚举常量赋给整型变量，j的值为0
```

##### 重载运算符

大多数的重载运算符可被定义为普通的非成员函数或者被定义为类成员函数。如果我们定义上面的函数为类的非成员函数，那么我们需要为每次操作传递两个参数，如下所示：

```c++
Box operator+(const Box&)const;//类成员函数
Box operator+(const Box&, const Box&);
```

##### 反三角函数

```
arcsin用asin
arccos用acos
arctan用atan
```

##### 读入数据

```c++
string s;
getline(cin, s);
cout << s << endl;//读入一整行的数据

char fgets ( char* str, int size, FILE* stream)*
*str: 字符型指针，用来存储所得数据的地址。字符数组。
size: 整型数据，要复制到str中的字符串的长度，包含终止NULL。
*stream:文件结构体指针，将要读取的文件流。
意义：从stream所指向的文件中读取size-1个字符送入字符串数组str中。

char str[N];
fgets(str,N,stdin)
```

##### define

```c++
#define x first
#define y second//用于p
```



#### string

##### substr

主要是pos <=size 但是可以等于 相当于越界了 但是这样可以取到空串

```c++
std::string a = "0123456789abcdefghij";
 
    // count is npos, returns [pos, size())
    std::string sub1 = a.substr(10);
    std::cout << sub1 << '\n';
 
    // both pos and pos+count are within bounds, returns [pos, pos+count)
    std::string sub2 = a.substr(5, 3);
    std::cout << sub2 << '\n';
 
    // pos is within bounds, pos+count is not, returns [pos, size()) 
    std::string sub4 = a.substr(a.size()-3, 50);
    // this is effectively equivalent to
    // std::string sub4 = a.substr(17, 3);
    // since a.size() == 20, pos == a.size()-3 == 17, and a.size()-pos == 3
 
    std::cout << sub4 << '\n';
 
    try {
        // pos is out of bounds, throws
        std::string sub5 = a.substr(a.size()+3, 50);
        std::cout << sub5 << '\n';
    } catch(const std::out_of_range& e) {
        std::cout << "pos exceeds string size\n";
    }
```

##### sscanf sprintf

```c++
int sscanf(const char *str, const char *format, ...)
sprintf
```



##### stringstream

```c++
string s;//注意这个时候不能ios::sync_with_stdio(false)
getline(cin, s);//读入一整行 没有回车
stringstream ssin(s);  //用字符流处理s
vector<string> str;
while (ssin >> s) str.push_back(s);  //将每个字符串加入到str中
```

##### 使用迭代器遍历字符串

```c++
for (auto id = s.begin(); id != s.end(); id++)
```

```c++
string to int 
stoi(s)
string to long long 
stoll(s)
string to fload
stof(s)
string to double
stod(s)
    char 数组
atoi(str)  atof atoll 
    tolower tou
```



##### 查找子字符串

```c++
const char* strstr( const char* haystack, const char* needle );//strstr
//从haystack中找needle 返回字符指针

s.find("is", 5);//find
//从s的5这个位置开始寻找 is的匹配的第一个位置

search(haystack.begin(), haystack.end(),//母串
       std:boyer_moore_searcher(needle.begin(), needle.end());//needle是字串
       
```

# Effective CPP

左值 与 右值 

左值引用 与 右值引用

```c++
//左值引用只能指向左值，不能指向右值
int a=5;
int &ref_a = a;//对
int &ref_a = 5;//错
const左值引用 可以指向右值 作为函数从形参
void push_back (const value_type& val);
```

```c++
//右值引用标志为&& 只能指向右值
int &&ref_a_right = 5; // 对
 
int a = 5;
int &&ref_a_left = a; // 错
 
ref_a_right = 6; // 右值引用的用途：可以修改右值
```

`std::move` **把左值强制转化为右值**   ***被声明出来* 的左、右值引用都是左值**

**作为函数形参时，右值引用更灵活**
