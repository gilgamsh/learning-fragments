#### string

##### 查找子字符串

```c++
const char* strstr( const char* haystack, const char* needle );//strstr
//从haystack中找needle 返回字符指针
s.find("is", 5);//find
//从s的5这个位置开始寻找 is的匹配的第一个位置
search(haystack.begin(), haystack.end(),
       std:boyer_moore_searcher(needle.begin(), needle.end())
       
```

