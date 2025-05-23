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

    i_range = tl.arange(0, B0) + pid * B0
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
def conv2d_kernel(
    x_ptr, k_ptr, z_ptr, N0, H, W, KH: tl.constexpr, KW: tl.constexpr, B0: tl.constexpr
):
    pid = tl.program_id(0)
    i_range = tl.arange(0, B0) + pid * B0
    i_mask = i_range < N0

    h_range = tl.arange(0, KH)
    w_range = tl.arange(0, KW)
    hw_range = h_range[:, None] * KW + w_range[None, :]

    k = tl.load(k_ptr + hw_range)


    for oj in tl.range(0, H):
        for ok in tl.range(0, W):
            oj_range = oj + h_range[None, :, None]
            ok_range = ok + w_range[None, None, :]
            x_range = i_range * H * W + oj_range * W + ok_range
            mask_x = (oj_range < H) & (ok_range < W)
            x = tl.load(x_ptr + x_range, mask=mask_x)

            z = tl.sum(x * k[None, :, :])
            z_range = i_range * H * W + oj * W + ok
            tl.store(z_ptr + z_range, z)

    return
```

### Matrix Multiplication
```python

def dot_spec(x: Float32[Tensor, "4 32 32"], y: Float32[Tensor, "4 32 32"]) -> Float32[Tensor, "4 32 32"]:
    return x @ y

@triton.jit
def dot_kernel(x_ptr, y_ptr, z_ptr, N0, N1, N2, MID, B0: tl.constexpr, B1: tl.constexpr, B2: tl.constexpr, B_MID: tl.constexpr):
    pid_0 = tl.program_id(0)
    pid_1 = tl.program_id(1)
    pid_2 = tl.program_id(2)

    i_range = tl.arange(0, B2) + pid_2 * B2
    i_mask = i_range < N2

    j_range = tl.arange(0, B0) + pid_0 * B0
    j_mask = j_range < N0

    k_range = tl.arange(0, B1) + pid_1 * B1
    k_mask = k_range < N1

    accu_z =  tl.zeros([B2,B0, B1], dtype=tl.float32)

    for mid in tl.range(0,MID,B_MID):
        mid_range = tl.arange(0, B_MID) + mid
        mid_mask = mid_range < MID

        x_range = i_range[:,None,None]*N0*MID + j_range[None,:,None]*MID + mid_range[None,None,:]
        x_mask = i_mask[:,None,None] & j_mask[None,:,None] & mid_mask[None,None,:]
        y_range = i_range[:,None,None]*N1*MID + mid_range[None,:,None]*MID + k_range[None,None,:]
        y_mask = i_mask[:,None,None] & mid_mask[None,:,None] & k_mask[None,None,:]

        x = tl.load(x_ptr + x_range, mask=x_mask)
        y = tl.load(y_ptr + y_range, mask=y_mask)

        accu_z += tl.dot(x, y)
    z_range = i_range[:,None,None]*N0*N1 + j_range[None,:,None]*N1 + k_range[None,None,:]
    z_mask = i_mask[:,None,None] & j_mask[None,:,None] & k_mask[None,None,:] 
        
    tl.store(z_ptr + z_range, accu_z, mask=z_mask)
```

### Quantized Matrix Multiplication Mult
```python
FPINT = 32 // 4
GROUP = 8

def quant_dot_spec(scale : Float32[Tensor, "32 8"],
                   offset : Int32[Tensor, "32"],
                   weight: Int32[Tensor, "32 8"],
                   activation: Float32[Tensor, "64 32"]) -> Float32[Tensor, "32 32"]:
    offset = offset.view(32, 1)
    def extract(x):
        over = torch.arange(8) * 4
        mask = 2**4 - 1
        return (x[..., None] >> over) & mask
    scale = scale[..., None].expand(-1, 8, GROUP).contiguous().view(-1, 64)
    offset = extract(offset)[..., None].expand(-1, 1, 8, GROUP).contiguous().view(-1, 64)
    return ( scale * (extract(weight).view(-1, 64) - offset))  @ activation

@triton.jit
def quant_dot_kernel(scale_ptr, offset_ptr, weight_ptr, activation_ptr,
                     z_ptr, N0, N1, MID, B0: tl.constexpr, B1: tl.constexpr, B_MID: tl.constexpr):
    pid_0 = tl.program_id(0)
    pid_1 = tl.program_id(1)
    
    j_range = tl.arange(0, B0) + pid_0 * B0
    k_range = tl.arange(0, B1) + pid_1 * B1

    j_mask = j_range < N0
    k_mask = k_range < N1

    z = tl.zeros([B0, B1], dtype=tl.float32)
    z_range = j_range[:, None] * N1 + k_range[None, :]
    z_mask = j_mask[:, None] & k_mask[None, :]

    for l in tl.range(0, MID, B_MID):
        l_div_g_range = tl.arange(0, B_MID // GROUP) + (l//GROUP)
        l_div_g_mask = l_div_g_range < (MID // GROUP)
        scale_range = j_range[:, None] * (MID // GROUP) + l_div_g_range[None, :]
        scale_mask = j_mask[:, None] & l_div_g_mask[None, :]

        scale = tl.load(scale_ptr + scale_range, mask=scale_mask)
        shift = tl.load(offset_ptr + j_range, mask=j_mask)

        l_weight_range = l + tl.arange(0, B_MID // FPINT)
        l_weight_mask = l_weight_range < (MID // FPINT)
        weight_range = j_range[:, None] * (MID // FPINT) + l_weight_range[None, :]
        weight_mask = j_mask[:, None] & l_weight_mask[None, :]
        weight = tl.load(weight_ptr + weight_range, mask=weight_mask)

        l_range = l + tl.arange(0, B_MID)
        l_mask = l_range < MID
        activation_range = l_range[:, None] * N1 + k_range[None, :]
        activation_mask = l_mask[:, None] & k_mask[None, :]
        activation = tl.load(activation_ptr + activation_range, mask=activation_mask)

        BITS = 32 // FPINT
        unpack_range = tl.arange(0, FPINT) * BITS
        unpack_upper_mask = (1 << BITS) - 1
        unpacked_shift = (shift[:, None] >> unpack_range) & unpack_upper_mask
        unpacked_weight = (weight[:,:, None] >> unpack_range) & unpack_upper_mask

        transformed_weight = (unpacked_weight - unpacked_shift[:,:,None]) * scale[:,:, None]
        transformed_weight = transformed_weight.reshape(unpacked_shift.shape[0], unpacked_shift.shape[-1] * FPINT)

        z += tl.dot(transformed_weight, activation)

    tl.store(z_ptr + z_range, z, mask=z_mask)

```