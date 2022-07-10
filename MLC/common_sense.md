<!--
 * @Date: 2022-07-10 11:18:24
 * @LastEditors: Juan Jiang
 * @LastEditTime: 2022-07-10 11:56:12
 * @FilePath: \learning-fragments\MLC\common_sense.md
-->
### Task

从**Development** Form (Python TF Torch JAX) 转变为 **Deployment** Form （不一定要代码生成）

目标: 整合不同的实现 最小化依赖 合理利用硬件加速  优化（内存，时间，可拓展性）

**对于Tensor Function 进行变换** (具体实现的优化 抽象的调整融合)

### Key elements

Tensor, Tensor Functions

####  Abstraction and implementation 

##### Computational Graph

计算图

##### Tensor Programs

张量程序 focus on loop and layout transformation

##### Libraries and Runtimes

算子库

##### Hardware Primitives

硬件指令