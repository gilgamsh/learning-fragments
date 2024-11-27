### load and store

```python
@triton.jit
def load_1d(x_ptr):
    range = tl.arange(0, 8)
    x = tl.load(x_ptr + range, range < 5, 0)

@triton.jit
def load_2d(x_ptr):
    i_range = tl.arange(0, 8)[:, None]
    j_range = tl.arange(0, 4)[None, :]
    range = i_range * 4 + j_range
    mask = (i_range < 5) & (j_range < 3)
    x = tl.load(x_ptr + range, mask, 0)

@triton.jit
def store_1d(z_ptr):
    range = tl.arange(0, 8)
    tl.store(z_ptr + range, 10, range < 5)

```
### program id

```python
@triton.jit
def program_id(x_ptr):
    pid = tl.program_id(0)
    range = tl.arange(0, 8) + pid * 8
    x = tl.load(x_ptr + range, range < 20)
```

### add
```python
def add_spec(x: Float32[Tensor, "32"]) -> Float32[Tensor, "32"]:
    "This is the spec that you should implement. Uses typing to define sizes."
    return x + 10.

@triton.jit
def add_kernel(x_ptr, z_ptr, N0, B0: tl.constexpr):
    '''
    only one block
    '''
    range = tl.arange(0, B0)
    x = tl.load(x_ptr + range)
    x = x + 10
    tl.store(z_ptr + range, x)

def add2_spec(x: Float32[Tensor, "200"]) -> Float32[Tensor, "200"]:
    return x + 10.

@triton.jit
def add_mask2_kernel(x_ptr, z_ptr, N0, B0: tl.constexpr):
    '''
    several blocks
    '''
    pid = tl.program_id(0)
    range = tl.arange(0,B0) + pid * B0
    mask = range<N0
    x = tl.load(x_ptr+range,mask)
    x = x + 10
    tl.store(z_ptr+range,x,mask)

    return
```

### Outer Vector Add
```python
def add_vec_spec(x: Float32[Tensor, "32"], y: Float32[Tensor, "32"]) -> Float32[Tensor, "32 32"]:
    return x[None, :] + y[:, None]

@triton.jit
def add_vec_kernel(x_ptr, y_ptr, z_ptr, N0, N1, B0: tl.constexpr, B1: tl.constexpr):
    '''
    only one block
    '''
    i_range = tl.arange(0, B0)
    j_range = tl.arange(0, B1)
    z_range = j_range[:, None] * B0 + i_range[None, :]

    x = tl.load(x_ptr + i_range)
    y = tl.load(y_ptr + j_range)
    z = x[None, :] + y[:, None]
    tl.store(z_ptr + z_range, z)
    return

def add_vec_block_spec(x: Float32[Tensor, "100"], y: Float32[Tensor, "90"]) -> Float32[Tensor, "90 100"]:
    return x[None, :] + y[:, None]

@triton.jit
def add_vec_block_kernel(x_ptr, y_ptr, z_ptr, N0, N1, B0: tl.constexpr, B1: tl.constexpr):
    '''
    several blocks
    '''
    pid_0 = tl.program_id(0)
    pid_1 = tl.program_id(1)
    i_range = tl.arange(0, B0) + pid_0 * B0
    j_range = tl.arange(0, B1) + pid_1 * B1
    z_range = j_range[:, None] * N0 + i_range[None, :]

    x_mask = i_range < N0
    y_mask = j_range < N1
    z_mask = x_mask[None, :] & y_mask[:, None]

    x = tl.load(x_ptr + i_range, x_mask)
    y = tl.load(y_ptr + j_range, y_mask)
    z = x[None, :] + y[:, None]
    
    tl.store(z_ptr + z_range, z, z_mask)
    return
```

### Fused Outer Multiplication
```python
def mul_relu_block_spec(x: Float32[Tensor, "100"], y: Float32[Tensor, "90"]) -> Float32[Tensor, "90 100"]:
    return torch.relu(x[None, :] * y[:, None])

@triton.jit
def mul_relu_block_kernel(x_ptr, y_ptr, z_ptr, N0, N1, B0: tl.constexpr, B1: tl.constexpr):
    pid_0 = tl.program_id(0)
    pid_1 = tl.program_id(1)
    i_range = tl.arange(0, B0) + pid_0 * B0
    j_range = tl.arange(0, B1) + pid_1 * B1
    z_range = j_range[:, None] * N0 + i_range[None, :]

    x_mask = i_range < N0
    y_mask = j_range < N1
    z_mask = x_mask[None, :] & y_mask[:, None]

    x = tl.load(x_ptr + i_range, x_mask)
    y = tl.load(y_ptr + j_range, y_mask)
    
    z = x[None, :] * y[:, None]
    z = tl.maximum(0, z)
    
    tl.store(z_ptr + z_range, z, z_mask)
    return
```

### Fused Outer Multiplication Backwards
```python
def mul_relu_block_back_spec(x: Float32[Tensor, "90 100"], y: Float32[Tensor, "90"],
                             dz: Float32[Tensor, "90 100"]) -> Float32[Tensor, "90 100"]:
    x = x.clone()
    y = y.clone()
    x = x.requires_grad_(True)
    y = y.requires_grad_(True)
    z = torch.relu(x * y[:, None])
    z.backward(dz)
    dx = x.grad
    return dx

@triton.jit
def mul_relu_block_back_kernel(x_ptr, y_ptr, dz_ptr, dx_ptr, N0, N1, B0: tl.constexpr, B1: tl.constexpr):
    '''
    since x has two dim, we use z_range and mask for x
    '''
    pid_0 = tl.program_id(0)
    pid_1 = tl.program_id(1)
    i_range = tl.arange(0, B0) + pid_0 * B0
    j_range = tl.arange(0, B1) + pid_1 * B1
    z_range = j_range[:, None] * N0 + i_range[None, :]

    x_mask = i_range < N0
    y_mask = j_range < N1
    z_mask = x_mask[None, :] & y_mask[:, None]

    x = tl.load(x_ptr + z_range, z_mask)
    y = tl.load(y_ptr + j_range, y_mask)
    dz = tl.load(dz_ptr + z_range, z_mask)
    
    d_relu = ((x * y[:, None]) > 0) * 1
    d_xy_x = y[:, None]
    dx = d_relu * d_xy_x * dz
    
    tl.store(dx_ptr + z_range, dx, z_mask)
    return
```

### Long Sum
```python
def sum_spec(x: Float32[Tensor, "4 200"]) -> Float32[Tensor, "4"]:
    return x.sum(1)

@triton.jit
def sum_kernel(x_ptr, z_ptr, N0, N1, T, B0: tl.constexpr, B1: tl.constexpr):
    pid_0 = tl.program_id(0)
    range = tl.arange(0, B0) + pid_0 * B0
    mask = range < N0

    z = tl.zeros([B0], dtype=tl.float32)

    for j in tl.range(0,T,B1):
        j_range = tl.arange(0, B1) + j
        ij_range = range[:, None] * T + j_range
        j_mask = j_range < T
        ij_mask = mask[:,None] & j_mask
        x = tl.load(x_ptr + ij_range, ij_mask)
        z += x.sum(1)

    tl.store(z_ptr + range, z, mask)
    return
```

### Long Softmax
```python
def softmax_spec(x: Float32[Tensor, "4 200"]) -> Float32[Tensor, "4 200"]:
    x_max = x.max(1, keepdim=True)[0]
    x = x - x_max
    x_exp = x.exp()
    return x_exp / x_exp.sum(1, keepdim=True)

@triton.jit
def softmax_kernel(x_ptr, z_ptr, N0, N1, T, B0: tl.constexpr, B1: tl.constexpr):
    '''
    naive implementation
    '''
    pid_0 = tl.program_id(0)
    log2_e = 1.44269504

    range = tl.arange(0, B0) + pid_0 * B0
    mask = range < N0

    exp_sum = tl.zeros([B0], dtype=tl.float32)
    x_max = tl.zeros([B0], dtype=tl.float32)

    for j in tl.range(0,T,B1):
        j_range = tl.arange(0, B1) + j
        ij_range = range[:, None] * T + j_range
        j_mask = j_range < T
        ij_mask = mask[:,None] & j_mask
        x = tl.load(x_ptr + ij_range, ij_mask)
        x_max = tl.maximum(x_max, x.max(1))

    for j in tl.range(0,T,B1):
        j_range = tl.arange(0, B1) + j
        ij_range = range[:, None] * T + j_range
        j_mask = j_range < T
        ij_mask = mask[:,None] & j_mask
        x = tl.load(x_ptr + ij_range, ij_mask)
        exp_x = tl.exp2( log2_e * (x - x_max[:, None]) )
        exp_sum += exp_x.sum(1)
    
    for j in tl.range(0,T,B1):
        j_range = tl.arange(0, B1) + j
        ij_range = range[:, None] * T + j_range
        j_mask = j_range < T
        ij_mask = mask[:,None] & j_mask
        x = tl.load(x_ptr + ij_range, ij_mask)
        exp_x = tl.exp2( log2_e * (x - x_max[:, None]) )
        z = exp_x / exp_sum[:, None]
        tl.store(z_ptr + ij_range, z, ij_mask)

    return


@triton.jit
def softmax_kernel(x_ptr, z_ptr, N0, N1, T, B0: tl.constexpr, B1: tl.constexpr):
    '''
    online version
    '''
    pid_0 = tl.program_id(0)
    log2_e = 1.44269504

    range = tl.arange(0, B0) + pid_0 * B0
    mask = range < N0

    exp_sum = tl.zeros([B0], dtype=tl.float32)
    x_max = tl.full([B0], -float('inf'), dtype=tl.float32)

    for j in tl.range(0,T,B1):
        j_range = tl.arange(0, B1) + j
        ij_range = range[:, None] * T + j_range
        j_mask = j_range < T
        ij_mask = mask[:,None] & j_mask
        x = tl.load(x_ptr + ij_range, ij_mask)

        tmp_x_max = tl.maximum(x_max, x.max(1))
        tmp_exp_x = tl.exp2( log2_e * (x - tmp_x_max[:, None]) )
        
        factor = tl.exp2( log2_e * (x_max - tmp_x_max) )
        exp_sum = exp_sum * factor + tmp_exp_x.sum(1)
        x_max = tmp_x_max

    
    for j in tl.range(0,T,B1):
        j_range = tl.arange(0, B1) + j
        ij_range = range[:, None] * T + j_range
        j_mask = j_range < T
        ij_mask = mask[:,None] & j_mask
        x = tl.load(x_ptr + ij_range, ij_mask)
        exp_x = tl.exp2( log2_e * (x - x_max[:, None]) )
        z = exp_x / exp_sum[:, None]
        tl.store(z_ptr + ij_range, z, ij_mask)

    return
```

### Simple FlashAttention
```python

def flashatt_spec(q: Float32[Tensor, "200"], k: Float32[Tensor, "200"], v: Float32[Tensor, "200"]) -> Float32[Tensor, "200"]:
    x = q[:, None] * k[None, :]
    x_max = x.max(1, keepdim=True)[0]
    x = x - x_max
    x_exp = x.exp()
    soft =  x_exp  / x_exp.sum(1, keepdim=True)
    return (v[None, :] * soft).sum(1)

@triton.jit
def flashatt_kernel(q_ptr, k_ptr, v_ptr, z_ptr, N0, T, B0: tl.constexpr):
    next_power_of_two = lambda x: 1 << (x - 1).bit_length()
    B1 = 32
    B0 = next_power_of_two(B0)

    pid = tl.program_id(0)
    log2_e = 1.44269504

    i_range = tl.arange(0, next_power_of_two(B0)) + pid * B0
    i_mask = i_range < N0

    q = tl.load(q_ptr + i_range, i_mask)

    exp_sum = tl.zeros([B0], dtype=tl.float32)
    qk_max = tl.full([B0], -float('inf'), dtype=tl.float32)
    z = tl.zeros([B0], dtype=tl.float32)

    for j in tl.range(0,T,B1):
        j_range = tl.arange(0, B1) + j
        j_mask = j_range < T
        ij_mask = i_mask[:,None] & j_mask
        k = tl.load(k_ptr + j_range, j_mask)
        qk = q[:, None] * k[None, :] + tl.where(ij_mask, 0, -float('inf'))

        tmp_max = tl.maximum(qk_max, qk.max(1))
        qk_exp = tl.exp2( log2_e * (qk - tmp_max[:, None]) )
        factor = tl.exp2( log2_e * (qk_max - tmp_max) )
        tmp_exp_sum = exp_sum * factor + qk_exp.sum(1)
        v = tl.load(v_ptr + j_range, j_mask)
        z = z * factor + (v[None, :] * qk_exp).sum(1)

        qk_max = tmp_max
        exp_sum = tmp_exp_sum
    
    z = z / exp_sum
    tl.store(z_ptr + i_range, z, i_mask)
    return
```

### Two Dimensional Convolution
```python
def conv2d_spec(x: Float32[Tensor, "4 8 8"], k: Float32[Tensor, "4 4"]) -> Float32[Tensor, "4 8 8"]:
    z = torch.zeros(4, 8, 8)
    x = torch.nn.functional.pad(x, (0, 4, 0, 4, 0, 0), value=0.0)
    print(x.shape, k.shape)
    for i in range(8):
        for j in range(8):
            z[:, i, j] = (k[None, :, :] * x[:, i: i+4, j: j + 4]).sum(1).sum(1)
    return z


@triton.jit
def conv2d_kernel(x_ptr, k_ptr, z_ptr, N0, H, W, KH: tl.constexpr, KW: tl.constexpr, B0: tl.constexpr):
    pid_0 = tl.program_id(0)
    return


```