# SimVQ 推理应用更新方案

## 1. 项目目标

本项目要做的是一个以推理为核心的 SimVQ 配套应用。当前阶段先做 CLI，把流程跑通；后续可以在此基础上继续补 GUI。

它不包含任何训练、微调、优化器、loss、wandb、checkpoint 保存等训练相关能力。

它要完成两件核心事情：

1. 对输入 POD5 的每条 read 做压缩，得到：
   - codebook ID 序列
   - 反归一化和重建所需元数据
2. 对压缩结果做解码，重建出有效的 POD5 文件

项目第一优先级是把流程跑通，第二优先级是把格式和接口定稳定，第三优先级才是压缩比和重建质量优化。

## 2. 硬边界

### 永久在范围内

- CLI 工具
- 后续 GUI
- 模型推理
- POD5 读取
- read 级压缩
- read 级重建
- bundle 打包与解包
- 模型下载、缓存、校验
- inspect / doctor 等辅助命令

### 永久不在范围内

- 训练
- 微调
- 蒸馏
- 量化训练
- loss 设计
- 数据集制作
- wandb
- checkpoint 训练管理
- 多用户服务平台

### 当前阶段不做，但后续可以做

- GUI / Desktop UI
- 更友好的可视化结果浏览
- 面向非命令行用户的交互封装

结论：

- 这是一个推理产品，不是训练产品的外壳。
- 当前先以 CLI 跑通完整闭环，GUI 放到后续阶段。
- 训练仓库只作为推理能力抽取来源，不作为本项目的主体。

## 3. 平台策略

### 主支持平台

- Linux x86_64
- NVIDIA CUDA GPU
- Python 3.11 / 3.12

### 次支持平台

- macOS

macOS 的目标不是保证完整推理，而是优先保证：

- `inspect`
- `doctor`
- bundle 解包和元数据查看

如果后续验证通过，再考虑把完整推理也纳入 macOS 支持。

### 当前承诺

- Linux GPU：完整支持 encode / decode
- macOS：先支持非推理命令
- CPU-only：不作为正式推理目标

## 4. 与原 `SimVQGAN` 仓库的关系

本项目只复用原仓库里的推理相关能力，不复制训练体系。

### 建议抽取的最小能力

- model 构建
- checkpoint 推理加载
- quantizer indices 导出
- `indices -> z_q -> decoder` 解码路径
- ADC / pA / 归一化 / 反归一化工具
- POD5 读写工具
- overlap-add / direct 重建逻辑

### 明确不抽取的部分

- train loop
- optimizer
- loss
- eval loop 中依赖训练上下文的代码
- wandb
- Dorado 训练期 perceptual loss 相关逻辑

### 需要补齐的最大缺口

目前还缺一个正式的公开推理接口：

- `token_ids -> quantized latents -> decoder -> normalized waveform`

这是 CLI 能不能成立的关键路径。

## 5. 模型分发策略

### 核心原则

- APP 不内置任何真实模型权重
- APP 只根据模型名下载对应模型
- 模型下载源以后由你维护
- GitHub 不作为当前 checkpoint 的依赖前提

### 运行方式

1. 用户传入 `--model MODEL_NAME`
2. CLI 查询远程模型目录
3. 若本地无缓存，则自动下载
4. 下载完成后校验 hash
5. 使用本地缓存做推理

### 当前阶段的临时方案

因为现在还没有真实 checkpoint 可下载，第一阶段允许存在一种“伪下载模型”：

- 模型名存在于远程目录里
- 下载动作可以是假的
- 最终得到的是一个随机初始化的 stub model
- 这个 stub model 仅用于把 encode / decode / pack / unpack / POD5 流程跑通
- 不保证任何重建质量

这意味着当前阶段的目标是：

- 流程打通
- 格式打通
- 命令打通

而不是追求数值表现。

### 推荐的远程模型目录格式

远端应提供一个模型清单，例如 `catalog.json`：

```json
{
  "catalog_version": "simvq.models",
  "models": [
    {
      "name": "V4.5",
      "mode": "stub_random",
      "config_url": "https://example.com/models/simvq-v45-stub/config.json",
      "checkpoint_url": "https://example.com/models/simvq-v45-stub/checkpoint.msgpack",
      "config_sha256": null,
      "checkpoint_sha256": null
    }
  ]
}
```

将来换成真实模型时，只需要把 `mode` 从 `stub_random` 切到 `real`，并补上真实 URL 与 hash。

### 本地缓存目录

建议缓存到：

```text
~/.cache/simvq/models/<model_name>/<version>/
```

目录内容示例：

```text
~/.cache/simvq/models/simvq-v45-stub/0.0.1/
  config.json
  checkpoint.msgpack
  metadata.json
```

## 6. 输出格式：`.vq` 与 `.vq.tar.gz`

### 目标

你希望先生成 `.vq`，然后进一步压缩成 `.vq.tar.gz` 以提升压缩比。这个方向是合理的。

### 这里建议的定义

- `.vq`：逻辑上的 bundle 目录格式
- `.vq.tar.gz`：最终默认交付产物

也就是说：

1. encode 时先在临时目录里生成一个 `xxx.vq/`
2. 再把这个目录整体打成 `xxx.vq.tar.gz`
3. decode / inspect 时优先支持直接读取 `.vq.tar.gz`
4. 为了调试方便，也允许直接读取已解包的 `.vq/` 目录

### 为什么这样定义

如果把 `.vq` 定义成单一文件，再额外套一层 tar.gz 也可以，但收益通常不如“目录 bundle -> tar.gz”清晰。

定义成目录 bundle 的好处：

- 内部结构可直接 inspect
- 便于调试
- 便于后续扩展元数据文件
- tar.gz 压缩多个文本与数组文件时更自然

### v1 的默认行为

- `simvq encode` 默认输出 `.vq.tar.gz`
- `simvq decode` 支持：
  - `.vq.tar.gz`
  - `.vq/`
- `simvq inspect` 支持：
  - `.vq.tar.gz`
  - `.vq/`

## 7. Bundle 内部结构

### 7.1 `xxx.vq/` 目录结构

```text
sample.vq/
  manifest.json
  metadata/
    run_infos.json
    end_reasons.json
  reads.jsonl
  chunks/
    tokens.000.npy
    norm_stats.000.npy
    valid_lengths.000.npy
    starts.000.npy
```

### 7.2 最终打包产物

```text
sample.vq.tar.gz
```

其中 tar 包内应当只包含一个顶层目录 `sample.vq/`，避免解包后文件散落。

### 7.3 `manifest.json`

建议结构：

```json
{
  "bundle_format": "simvq.vq/v1",
  "packaging": {
    "kind": "tar.gz",
    "inner_bundle_dir": "sample.vq"
  },
  "tool": {
    "name": "simvq",
    "version": "0.1.0"
  },
  "created_at": "2026-04-04T00:00:00Z",
  "model": {
    "model_name": "simvq-v45-stub",
    "model_version": "0.0.1",
    "model_variant": "v45",
    "source_mode": "stub_random",
    "config_sha256": null,
    "checkpoint_sha256": null,
    "codebook_size": 65536,
    "token_dtype": "uint16"
  },
  "chunking": {
    "chunk_size": 12288,
    "hop_size": 11688,
    "short_chunk_policy": "normalize_then_zero_pad",
    "pad_value_in_normalized_space": 0.0,
    "reconstruction_mode": "overlap_add_valid_only",
    "tokens_per_chunk": 4096
  },
  "counts": {
    "read_count": 123,
    "chunk_count": 4567
  },
  "paths": {
    "reads": "reads.jsonl",
    "run_infos": "metadata/run_infos.json",
    "end_reasons": "metadata/end_reasons.json",
    "token_shards": ["chunks/tokens.000.npy"],
    "norm_stat_shards": ["chunks/norm_stats.000.npy"],
    "valid_length_shards": ["chunks/valid_lengths.000.npy"],
    "start_shards": ["chunks/starts.000.npy"]
  }
}
```

## 8. read 级元数据要求

为了在没有原始 signal 的前提下独立重建出 POD5，每条 read 除 signal 外的关键元数据都必须保存。

建议保存：

- `read_id`
- `pore`
  - `channel`
  - `well`
  - `pore_type`
- `calibration`
  - `offset`
  - `scale`
- `read_number`
- `start_sample`
- `median_before`
- `end_reason`
  - 可用索引引用
- `run_info`
  - 可用索引引用
- `num_minknow_events`
- `tracked_scaling`
- `predicted_scaling`
- `num_reads_since_mux_change`
- `time_since_mux_change`
- `open_pore_level`

read record 还应包含：

- `raw_length`
- `trimmed_length`
- `chunk_offset`
- `chunk_count`
- `sample_rate_hz`

## 9. Chunk 策略更新

这是本次更新里最关键的一部分。

### 9.1 需要解决的两个问题

当前要显式覆盖：

1. 长度小于 `12288` 的 read
2. 长度大于 `12288`，但最后剩余部分不足 `12288` 的尾块

### 9.2 v1 采用的策略

对任何不足 `12288` 的 chunk，一律采用：

1. 先取有效原始样本
2. ADC -> pA
3. 只对有效样本做归一化
4. 归一化之后，在尾部补 `0` 到长度 `12288`
5. 保存：
   - `center`
   - `half_range`
   - `valid_length`
   - `start`
6. 模型看到的是完整长度 `12288` 的输入
7. 解码后只取前 `valid_length` 的有效区域参与重建

### 9.3 为什么我认为这个方案在 v1 是合理的

这个方案的优点：

- 实现简单
- 和固定长度模型兼容
- `0` 在归一化空间中表示 chunk 中心值，语义比直接在 ADC/pA 空间补值更稳定
- 解码后通过 `valid_length` 可以把 padding 区域完全裁掉

### 9.4 必须额外保存的字段

为了支持这个策略，必须新增每个 chunk 的：

- `valid_length`
- `start`

因此不能只靠 `chunk_count` 和统一策略来隐式推断所有 chunk。

### 9.5 interior chunk 与 tail chunk

推荐继续保留当前主策略：

- 主体 chunk 仍按 `hop_size = 11688` 生成
- 但不再采用 `shift_last`
- 当最后剩余有效长度不足 `12288` 时，生成一个独立 tail chunk
- 这个 tail chunk 走“先归一化，再 zero-pad”的路径

这样做的优点是：

- 最大程度贴近当前模型的训练 / 验证分布
- 同时覆盖短 read 和短尾块

### 9.6 解码时的重建规则

解码后：

- 每个 chunk 输出仍是长度 `12288`
- 但只取前 `valid_length` 的部分视为有效输出
- 对于 overlap-add：
  - 权重只作用于有效区域
  - padding 对应区域权重为 `0`
- 对于长度小于 `12288` 的整条 read：
  - 只保留前 `valid_length` 样本
  - 其余 padding 区域丢弃

### 9.7 备选方案说明

后续可以实验但不作为 v1 默认的方案：

- `edge_pad`：用最后一个有效点补齐
- `reflect_pad`：镜像补齐
- `shift_last`：继续使用满长最后窗口，不单独建 tail chunk

我的判断是：

- 在没有系统 benchmark 之前，`normalize_then_zero_pad` 是最稳妥的 v1 方案
- 如果后续发现尾部重建质量明显受损，再比较 `zero_pad` 与 `reflect_pad`

## 10. 核心接口

CLI 应当尽量薄，真正稳定的边界应当落在库接口上。

### 10.1 远程模型目录与本地缓存

```python
@dataclass
class RemoteModelSpec:
    name: str
    version: str
    variant: str
    mode: str  # "real" | "stub_random"
    config_url: str | None
    checkpoint_url: str | None
    config_sha256: str | None
    checkpoint_sha256: str | None
```

```python
@dataclass
class CachedModel:
    name: str
    version: str
    variant: str
    mode: str
    local_dir: Path
    config_path: Path
    checkpoint_path: Path | None
```

```python
class ModelCatalogClient:
    def list_remote(self) -> list[RemoteModelSpec]: ...
    def get_remote(self, name: str) -> RemoteModelSpec: ...
```

```python
class ModelStore:
    def list_local(self) -> list[CachedModel]: ...
    def has_local(self, name: str) -> bool: ...
    def get_local(self, name: str) -> CachedModel: ...
    def pull(self, name: str) -> CachedModel: ...
    def remove(self, name: str) -> None: ...
```

### 10.2 模型运行时接口

```python
class ModelRuntime:
    @classmethod
    def from_cached_model(cls, model: CachedModel, device: str = "auto") -> "ModelRuntime": ...

    @property
    def chunk_size(self) -> int: ...

    @property
    def tokens_per_chunk(self) -> int: ...

    @property
    def codebook_size(self) -> int: ...

    def encode_normalized_chunks(self, chunks: np.ndarray, batch_size: int) -> np.ndarray:
        """
        输入 shape: [N, 12288], float32, 值域 [-1, 1]
        输出 shape: [N, tokens_per_chunk], token ID
        """

    def decode_token_chunks(self, token_ids: np.ndarray, batch_size: int) -> np.ndarray:
        """
        输入 shape: [N, tokens_per_chunk]
        输出 shape: [N, 12288], float32, 归一化波形
        """
```

### 10.3 POD5 模板接口

```python
@dataclass
class Pod5ReadTemplate:
    read_id: str
    pore: dict
    calibration: dict
    read_number: int
    start_sample: int
    median_before: float
    end_reason_index: int
    run_info_index: int
    num_minknow_events: int
    tracked_scaling: dict
    predicted_scaling: dict
    num_reads_since_mux_change: int
    time_since_mux_change: float
    open_pore_level: float
```

```python
class Pod5TemplateSerializer:
    def extract_from_record(self, record: Any) -> Pod5ReadTemplate: ...
    def build_pod5_read(self, template: Pod5ReadTemplate, signal: np.ndarray, tables: Any) -> Any: ...
```

### 10.4 Bundle 读写接口

```python
@dataclass
class BundleManifest:
    bundle_format: str
    packaging: dict
    model: dict
    chunking: dict
    counts: dict
    paths: dict
```

```python
class BundleWriter:
    def open_dir(self, bundle_dir: Path, manifest: BundleManifest) -> None: ...
    def write_metadata_tables(self, run_infos: list[dict], end_reasons: list[dict]) -> None: ...
    def write_read_record(self, record: dict) -> None: ...
    def write_token_shard(self, token_ids: np.ndarray) -> None: ...
    def write_norm_stat_shard(self, norm_stats: np.ndarray) -> None: ...
    def write_valid_length_shard(self, valid_lengths: np.ndarray) -> None: ...
    def write_start_shard(self, starts: np.ndarray) -> None: ...
    def close(self) -> None: ...
```

```python
class BundleReader:
    def open(self, bundle_path: Path) -> None: ...
    def manifest(self) -> BundleManifest: ...
    def iter_read_records(self) -> Iterator[dict]: ...
    def iter_token_shards(self) -> Iterator[np.ndarray]: ...
    def iter_norm_stat_shards(self) -> Iterator[np.ndarray]: ...
    def iter_valid_length_shards(self) -> Iterator[np.ndarray]: ...
    def iter_start_shards(self) -> Iterator[np.ndarray]: ...
```

### 10.5 打包与解包接口

```python
class BundlePackager:
    def pack(self, bundle_dir: Path, output_tar_gz: Path) -> Path: ...
    def unpack(self, tar_gz_path: Path, work_dir: Path) -> Path: ...
```

### 10.6 端到端编解码接口

```python
@dataclass
class EncodeRequest:
    input_pod5: Path
    output_bundle: Path  # 默认是 .vq.tar.gz
    model_name: str
    batch_size: int = 128
    chunk_size: int = 12288
    hop_size: int = 11688
    short_chunk_policy: str = "normalize_then_zero_pad"
    reconstruction_mode: str = "overlap_add_valid_only"
    overwrite: bool = False
    summary_json: Path | None = None
```

```python
@dataclass
class DecodeRequest:
    input_bundle: Path  # .vq.tar.gz or .vq/
    output_pod5: Path
    model_name: str
    batch_size: int = 128
    overwrite: bool = False
    summary_json: Path | None = None
```

```python
@dataclass
class EncodeResult:
    output_bundle: Path
    read_count: int
    chunk_count: int
    raw_bundle_size_bytes: int
    packed_bundle_size_bytes: int
```

```python
@dataclass
class DecodeResult:
    output_pod5: Path
    read_count: int
    chunk_count: int
```

## 11. CLI 命令集合

### 11.1 `simvq encode`

用途：

- `POD5 -> .vq.tar.gz`

示例：

```bash
simvq encode input.pod5 \
  --model simvq-v45-stub \
  --output input.vq.tar.gz
```

推荐参数：

- `--model NAME`
- `--output PATH`
- `--batch-size INT`
- `--chunk-size 12288`
- `--hop-size 11688`
- `--short-chunk-policy normalize_then_zero_pad`
- `--summary-json PATH`
- `--overwrite`
- `--device {auto,cuda,cpu,metal}`
- `--keep-unpacked-vq`
- `--max-reads INT`

预期行为：

- 若本地没有该模型，则自动下载
- 若当前是 stub model，也照常跑流程
- 先生成临时 `.vq/`
- 再打包成 `.vq.tar.gz`

### 11.2 `simvq decode`

用途：

- `.vq.tar.gz -> POD5`
- `.vq/ -> POD5`

示例：

```bash
simvq decode input.vq.tar.gz \
  --model simvq-v45-stub \
  --output reconstructed.pod5
```

推荐参数：

- `--model NAME`
- `--output PATH`
- `--batch-size INT`
- `--summary-json PATH`
- `--overwrite`
- `--device {auto,cuda,cpu,metal}`
- `--allow-model-mismatch`

### 11.3 `simvq inspect`

用途：

- 查看 `.vq.tar.gz` 或 `.vq/` 的 manifest、统计信息和 read 摘要

参数：

- `--json`
- `--show-reads`
- `--max-reads INT`

### 11.4 `simvq doctor`

用途：

- 检查环境与依赖

检查项：

- Python 版本
- `pod5` 导入状态
- JAX 导入状态
- GPU 可用性
- 模型目录可达性
- 本地缓存状态

### 11.5 `simvq model ...`

推荐子命令：

- `simvq model list-remote`
- `simvq model list-local`
- `simvq model pull NAME`
- `simvq model show NAME`
- `simvq model remove NAME`

这里不再使用“手工 register 本地路径”作为主路径，因为你的目标是按模型名自动下载。

## 12. 编码算法

对每条输入 read：

1. 读取原始 ADC 信号
2. 提取 POD5 模板元数据
3. ADC -> pA
4. 按 `chunk_size=12288`、`hop_size=11688` 生成 chunk
5. 对每个 chunk：
   - 取有效样本
   - 仅对有效样本做归一化
   - 保存 `center` / `half_range`
   - 若有效长度不足 `12288`，则在归一化空间尾部补 `0`
   - 保存 `valid_length`
   - 保存 `start`
6. 批量送入 encoder，拿到 token IDs
7. 写出 `.vq/` bundle
8. 打成 `.vq.tar.gz`

## 13. 解码算法

对每个输入 bundle：

1. 若输入是 `.vq.tar.gz`，先解包到临时目录
2. 读取 manifest
3. 检查模型名、模型版本、模型模式、hash
4. 若本地模型缺失，则自动下载
5. 批量读取 token IDs
6. 调用 `decode_token_chunks`
7. 对每个 chunk：
   - 用 `center` / `half_range` 做反归一化
   - 只取前 `valid_length` 为有效区域
   - 有效区域 pA -> ADC
8. 对每条 read：
   - 按 `start`
   - 按有效长度
   - 用 `overlap_add_valid_only` 重建完整 read
9. 用模板元数据 + reconstructed signal 写回 POD5

## 14. 模型侧必须补齐的改造

### 14.1 增加正式的 `decode_indices`

目标：

```python
def decode_indices(self, indices: jnp.ndarray, *, train: bool = False, rng=None):
    """
    indices: [B, T_tokens]
    returns: normalized waveform [B, 12288]
    """
```

内部逻辑：

1. 投影 codebook
2. gather embeddings
3. 走 `decode(z_q)`

### 14.2 推理运行时包装

我们需要一个完全推理导向的包装层，统一提供：

- 读取最小 model config
- 加载 checkpoint 或 stub model
- encode normalized chunks
- decode token chunks
- 暴露模型元数据

### 14.3 彻底去训练化

本项目内不保留以下对象：

- optimizer state
- loss config
- train config
- eval schedule
- wandb
- checkpoint save policy

如果某些训练配置字段只是为了描述模型结构，后续应当提取成最小 inference config，而不是继续复用完整 `train.json`。

## 15. 输出与报告

所有会生成文件的命令都应支持 summary JSON。

建议字段：

- command
- input path
- output path
- model name
- model version
- model mode
- download_performed
- chunk size
- hop size
- short_chunk_policy
- read count
- chunk count
- unpacked_vq_size_bytes
- packed_vq_tar_gz_size_bytes
- elapsed seconds
- warnings

## 16. 错误处理与退出码

建议退出码：

- `0`：成功
- `2`：CLI 参数错误
- `3`：依赖或环境错误
- `4`：模型下载或模型兼容性错误
- `5`：bundle 格式损坏或不支持
- `6`：POD5 读写失败
- `7`：模型推理失败

应明确失败的情况：

- 模型目录不可达
- 下载失败
- hash 校验失败
- read template 字段缺失
- bundle 版本不兼容
- `valid_length` 非法
- padding 策略与 manifest 不匹配

## 17. 测试计划

### 单元测试

- tar.gz 打包与解包
- manifest schema
- 远程模型目录解析
- stub model 下载与缓存
- `normalize_then_zero_pad` 策略
- `valid_length` 裁剪逻辑
- overlap-add 只作用于 valid 区域

### 集成测试

- 使用 stub model 跑通：
  - `POD5 -> .vq.tar.gz -> POD5`
- 支持短 read
- 支持短尾块
- 检查 read 数是否一致
- 检查 bundle 解包后结构是否正确

### 平台冒烟测试

- Linux GPU：encode/decode
- macOS：inspect/doctor/unpack

## 18. 交付阶段

### Phase 0：项目脚手架

交付物：

- 仓库结构
- 打包配置
- CLI 入口
- `doctor`

验收标准：

- `simvq --help`
- `simvq doctor`

### Phase 1：模型目录与 stub 下载

交付物：

- `ModelCatalogClient`
- `ModelStore`
- `model list-remote`
- `model pull`
- stub model 生成/下载逻辑

验收标准：

- 能按模型名拿到一个本地可解析的 stub model

### Phase 2：推理运行时抽取

交付物：

- inference-only runtime
- `encode_normalized_chunks`
- `decode_token_chunks`
- `decode_indices`

验收标准：

- 不依赖训练流程即可完成 token encode/decode

### Phase 3：新的 chunk 策略

交付物：

- `normalize_then_zero_pad`
- `valid_length`
- `start`
- `overlap_add_valid_only`

验收标准：

- 短 read 和短尾块都能稳定跑通

### Phase 4：`.vq` / `.vq.tar.gz` bundle

交付物：

- `.vq/` 目录 bundle
- `.vq.tar.gz` 打包与解包
- inspect 支持两种输入

验收标准：

- bundle 写读和 tar.gz 打包解包都可用

### Phase 5：CLI encode/decode

交付物：

- `simvq encode`
- `simvq decode`

验收标准：

- 在 Linux GPU 上跑通真实 POD5 -> `.vq.tar.gz` -> POD5

### Phase 6：加固

交付物：

- summary JSON
- 错误处理加固
- 基础测试补齐

验收标准：

- 可以给外部用户做首轮试用

### Phase 7：GUI 封装

交付物：

- 基于现有 CLI / runtime 的 GUI 外壳
- 模型下载状态展示
- encode / decode 任务入口
- 结果文件与 summary 可视化

验收标准：

- 不需要命令行，也能完成模型下载、压缩和重建

## 19. 当前建议的默认决策

我建议当前直接定下以下默认值：

1. 默认输出格式：`.vq.tar.gz`
2. 调试格式：可保留 `.vq/`
3. 模型来源：按模型名自动下载
4. 当前下载模式：允许 `stub_random`
5. chunk 长度：`12288`
6. hop：`11688`
7. 短块策略：`normalize_then_zero_pad`
8. pad 值：归一化空间中的 `0`
9. 重建模式：`overlap_add_valid_only`
10. 项目属性：永久纯推理，不带任何训练能力

## 20. 下一步最小可实现切片

最小且正确的第一段实现，建议是：

1. 搭好 CLI 骨架
2. 做 `doctor`
3. 做远程模型目录与 stub model 下载
4. 做 inference-only runtime
5. 做 `decode_indices`
6. 做短块 `normalize_then_zero_pad`
7. 做 `.vq/` bundle 写入
8. 做 `.vq.tar.gz` 打包
9. 做 `simvq encode`
10. 做 `simvq decode`

这样一来，即使没有真实 checkpoint，也能先把整个产品闭环跑通。
