<!--
 * @Date: 2022-07-10 12:01:12
 * @LastEditors: Juan Jiang
 * @LastEditTime: 2022-07-12 12:42:52
 * @FilePath: \learning-fragments\MLC\Tensor_Programs.md
-->
### Tensor Program

recap: tensor , tensor function

#### Primitive Tensor Function

fine grained program transformation 
基本的算子函数 不做内存分配

#### Tensor Program Abstraction

focus on loop and memory layout

inout buffer , loop nests , computations

##### loop splitting

常见变换 

##### loop reorder

##### thread binding 

#### Extra structure in Tensor Program Abstraction
程序的循环间 存在可能的依赖 如果能在编程时，开发者有意识插入额外信息提示，会有帮助。