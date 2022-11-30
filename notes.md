<!--
 * @Date: 2022-11-17 17:16:50
 * @LastEditors: Juan Jiang
 * @LastEditTime: 2022-11-17 17:44:12
 * @FilePath: \learning-fragments\notes.md
-->


#### 可持久化

需要原本的数据结构插入不会改变拓扑序。 比如平衡二叉树的左旋右旋，会改变拓扑序，所以不可持久化。
目的：记录所有的历史版本。（support rollback）

##### 可持久化trie
每一个节点裂成一个新节点，如果它的儿子节点发生了变化。 （特例：每次插入，根节点都要裂成新节点）
如果没有发生变化 则复用这个节点。
 {cat rat car dry} 
 版本1  版本2
  o- -o  
 c| /r|
a/   a|
t\   t|
 cat  rat

```cpp

p = root[i-1]; // p is the root of the previous version
q = root[i] = ++ idx; // q is the root of the current version
if (p) tr[q] = tr[p]; // copy the previous version



```