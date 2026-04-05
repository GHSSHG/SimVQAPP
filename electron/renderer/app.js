const TRANSLATIONS = {
  "zh-CN": {
    "app.window_title": "SimVQ Desktop",
    "brand.tagline": "面向常规电脑用户的压缩与重建工作台",
    "nav.group.core": "核心工作流",
    "nav.group.analysis": "辅助分析",
    "nav.group.settings": "全局设置",
    "nav.encode.title": "压缩 Encode",
    "nav.encode.subtitle": "拖入 POD5 并启动高保真压缩",
    "nav.decode.title": "重建 Decode",
    "nav.decode.subtitle": "从 bundle 还原可用的 POD5 文件",
    "nav.tasks.title": "任务历史",
    "nav.tasks.subtitle": "查看进度、结果与日志",
    "nav.inspect.title": "文件探查",
    "nav.inspect.subtitle": "快速读取 bundle 的核心信息",
    "nav.models.title": "模型管理",
    "nav.models.subtitle": "查看、拉取和维护本地模型",
    "nav.home.title": "系统设置",
    "nav.home.subtitle": "配置环境路径并运行自检",
    "toolbar.refresh_all": "刷新全部",
    "view.encode.title": "压缩 Encode",
    "view.encode.subtitle": "拖入源文件、选择模型，然后开始后台压缩任务。",
    "view.decode.title": "重建 Decode",
    "view.decode.subtitle": "选择 bundle 与对应模型，把结果重建为可用的 POD5 文件。",
    "view.tasks.title": "任务历史",
    "view.tasks.subtitle": "查看最近任务的状态、耗时、输出结果与运行日志。",
    "view.inspect.title": "文件探查",
    "view.inspect.subtitle": "读取 bundle 的核心字段，快速判断模型、分块与内容概况。",
    "view.models.title": "模型管理",
    "view.models.subtitle": "查看可拉取模型、维护本地模型，并为工作流提供下拉选项。",
    "view.home.title": "环境与系统设置",
    "view.home.subtitle": "配置环境路径、模型目录地址，并查看当前系统依赖是否齐备。",
    "settings.panel.title": "环境与系统设置",
    "settings.panel.subtitle": "配置运行环境与模型目录地址，之后即可在桌面端稳定执行任务。",
    "settings.language.label": "语言",
    "settings.language.option.zh-CN": "简体中文",
    "settings.language.option.en": "English",
    "settings.python.label": "Python 可执行文件",
    "settings.python.placeholder": "python3",
    "settings.repo_root.label": "SimVQ 仓库根目录",
    "settings.repo_root.placeholder": "/path/to/SimVQApp",
    "settings.repo_root.browse": "选择目录",
    "settings.catalog_url.label": "远程模型目录 URL（可留空）",
    "settings.catalog_url.placeholder": "https://example.com/catalog.json",
    "settings.model_repo.label": "模型源码仓库（真实模型可选）",
    "settings.model_repo.placeholder": "/path/to/SimVQGAN",
    "settings.model_repo.browse": "选择目录",
    "settings.save": "保存设置",
    "settings.run_doctor": "重新检查环境",
    "doctor.panel.title": "系统自检",
    "doctor.panel.subtitle": "默认显示可读的依赖状态，原始诊断信息只保留在开发者视图中。",
    "doctor.raw": "查看原始诊断 JSON",
    "models.remote.title": "可拉取模型",
    "models.remote.subtitle": "优先展示可直接拉取的远程模型，便于快速完成部署。",
    "models.remote.placeholder": "沿用系统设置中的 catalog URL",
    "models.remote.refresh": "刷新远程",
    "models.local.title": "本地已安装模型",
    "models.local.subtitle": "这些模型可直接出现在压缩与重建页面的下拉选择中。",
    "models.local.refresh": "刷新本地",
    "models.detail.title": "模型详情",
    "models.detail.subtitle": "优先展示版本、运行参数与本地路径，原始 payload 默认折叠。",
    "models.detail.raw": "查看原始模型 JSON",
    "models.register.toggle.title": "注册本地模型",
    "models.register.toggle.subtitle": "只有在已经准备好 checkpoint 时再展开",
    "register.name.label": "模型名",
    "register.name.placeholder": "simvq-v45-3x",
    "register.checkpoint.label": "Checkpoint 目录",
    "register.checkpoint.placeholder": "/path/to/checkpoint_1200000",
    "register.checkpoint.browse": "选择目录",
    "register.source_repo.label": "来源仓库",
    "register.source_repo.placeholder": "/path/to/SimVQGAN",
    "register.source_repo.browse": "选择目录",
    "register.config_json.label": "配置 JSON",
    "register.config_json.placeholder": "/path/to/train.json",
    "register.config_json.browse": "选择文件",
    "register.version.label": "版本（可留空）",
    "register.version.placeholder": "1200000",
    "register.variant.label": "Variant",
    "register.overwrite": "允许覆盖已有同名版本",
    "register.submit": "注册模型",
    "encode.panel.title": "压缩任务",
    "encode.panel.subtitle": "默认只保留输入、输出和模型三项核心决策，其他参数放进高级设置。",
    "encode.field.input": "输入文件",
    "encode.field.output": "输出位置",
    "encode.field.model": "压缩模型",
    "encode.model.hint": "直接从本地已注册模型中选择，避免手动输入模型名带来的拼写错误。",
    "encode.advanced": "展开高级设置",
    "encode.batch": "Batch Size",
    "encode.chunk": "Chunk Size",
    "encode.hop": "Hop Size",
    "encode.short_policy": "短块策略",
    "encode.overwrite": "允许覆盖已有输出文件",
    "encode.submit": "开始压缩",
    "guide.title": "操作引导",
    "guide.encode.1": "拖入源文件，或点击选择 `.pod5` 文件。",
    "guide.encode.2": "从本地可用模型中选择对应的压缩模型。",
    "guide.encode.3": "点击开始，系统会在后台自动完成高保真压缩。",
    "decode.panel.title": "重建任务",
    "decode.panel.subtitle": "把 bundle 还原为 POD5 文件，仅默认展示最关键的三项输入。",
    "decode.field.input": "输入 Bundle",
    "decode.field.output": "输出位置",
    "decode.field.model": "重建模型",
    "decode.model.hint": "这里同样只显示本地已安装模型，确保任务可以直接执行。",
    "decode.advanced": "展开高级设置",
    "decode.batch": "Batch Size",
    "decode.overwrite": "允许覆盖已有输出文件",
    "decode.submit": "开始重建",
    "guide.decode.1": "拖入需要还原的 bundle 文件。",
    "guide.decode.2": "选择与 bundle 对应的本地模型。",
    "guide.decode.3": "点击开始，系统会在后台自动完成重建并记录结果。",
    "inspect.panel.title": "文件探查",
    "inspect.panel.subtitle": "快速读取 bundle 的关键字段，帮助你先理解内容再决定是否重建。",
    "inspect.field.bundle": "Bundle 文件",
    "inspect.submit": "开始探查",
    "inspect.result.title": "探查结果",
    "inspect.result.subtitle": "优先显示普通用户真正需要看的字段，原始 JSON 只保留在开发者开关中。",
    "inspect.raw": "查看原始 Manifest JSON",
    "tasks.panel.title": "任务历史",
    "tasks.panel.subtitle": "按类型、文件名和状态查看最近的压缩与重建任务。",
    "tasks.refresh": "刷新任务",
    "tasks.detail.title": "任务详情",
    "tasks.detail.subtitle": "默认呈现耗时、状态和输出结果，原始 JSON 收进开发者视图。",
    "tasks.raw": "查看原始结果 JSON",
    "tasks.log": "运行日志",
    "picker.choose_file": "选择文件",
    "picker.choose_location": "选择位置",
    "picker.clear": "清空",
    "picker.encode_input.kicker": "输入文件",
    "picker.encode_input.empty_title": "点击选择文件，或将 .pod5 文件拖拽至此",
    "picker.encode_input.empty_description": "选中文件后仅展示文件名，完整路径会在悬停时显示。",
    "picker.encode_input.filled_description": "POD5 输入文件",
    "picker.encode_output.kicker": "输出位置",
    "picker.encode_output.empty_title": "选择压缩结果的保存位置",
    "picker.encode_output.empty_description": "默认会根据输入文件自动生成 .vq.tar.gz 文件名。",
    "picker.encode_output.filled_description": "输出 Bundle",
    "picker.decode_input.kicker": "输入文件",
    "picker.decode_input.empty_title": "点击选择文件，或将 bundle 拖拽至此",
    "picker.decode_input.empty_description": "支持 `.vq.tar.gz` 或 `.vq` 文件，完整路径仅在悬停时显示。",
    "picker.decode_input.filled_description": "Bundle 输入文件",
    "picker.decode_output.kicker": "输出位置",
    "picker.decode_output.empty_title": "选择重建结果的保存位置",
    "picker.decode_output.empty_description": "默认会根据输入 bundle 自动生成 `.reconstructed.pod5` 文件名。",
    "picker.decode_output.filled_description": "输出 POD5",
    "picker.inspect_input.kicker": "待探查文件",
    "picker.inspect_input.empty_title": "点击选择文件，或将 bundle 拖拽至此",
    "picker.inspect_input.empty_description": "读取完成后只展示关键字段，完整路径仅在悬停时显示。",
    "picker.inspect_input.filled_description": "待探查 Bundle",
    "common.none": "—",
    "common.seconds_under_one": "少于 1 秒",
    "common.hours_minutes": "{hours} 小时 {minutes} 分",
    "common.minutes_seconds": "{minutes} 分 {seconds} 秒",
    "common.seconds": "{seconds} 秒",
    "task.status.running": "进行中",
    "task.status.cancelling": "取消中",
    "task.status.completed": "已完成",
    "task.status.failed": "失败",
    "task.status.cancelled": "已取消",
    "task.status.interrupted": "已中断",
    "task.kind.encode": "压缩",
    "task.kind.decode": "重建",
    "task.current": "当前任务",
    "task.select.empty.title": "尚未选中任务",
    "task.select.empty.desc": "从左侧列表选择一个任务，查看结果摘要和运行日志。",
    "task.list.empty.title": "暂无任务",
    "task.list.empty.desc": "启动压缩或重建后，任务结果和日志都会出现在这里。",
    "task.detail.processing": "后台正在处理",
    "task.detail.failed": "任务执行失败",
    "task.detail.completed": "{kind}已完成",
    "task.metric.status": "状态",
    "task.metric.duration": "耗时",
    "task.metric.reads": "Reads",
    "task.metric.chunks": "Chunks",
    "task.metric.output_size": "输出体积",
    "task.metric.raw_size": "原始体积",
    "task.metric.started_at": "开始时间",
    "task.metric.ended_at": "结束时间",
    "task.core": "核心信息",
    "task.extra": "状态补充",
    "task.input": "输入文件",
    "task.output": "输出文件",
    "task.created_at": "创建时间",
    "task.error": "错误信息",
    "task.exit_code": "退出码",
    "task.action.cancel": "取消",
    "task.reveal": "定位输出",
    "task.open": "打开输出",
    "task.log.empty": "暂无日志。",
    "task.fallback_name": "{kind}任务",
    "models.remote.empty.title": "暂无远程模型",
    "models.remote.empty.desc": "刷新 catalog，或者检查系统设置中的远程模型目录地址。",
    "models.local.empty.title": "暂无本地模型",
    "models.local.empty.desc": "先从上方拉取模型，或在页面底部展开表单注册已有 checkpoint。",
    "models.detail.empty.title": "尚未选中模型",
    "models.detail.empty.desc": "点击本地模型的“详情”，这里会显示版本、运行模式和路径信息。",
    "models.pull": "拉取",
    "models.show": "详情",
    "models.remove": "删除",
    "models.version": "版本 {version}",
    "models.untagged_version": "未标注",
    "models.variant_missing": "未标注 Variant",
    "models.cache": "本地缓存",
    "models.runtime": "运行参数",
    "models.local_dir": "本地目录",
    "models.config_path": "配置文件",
    "models.checkpoint": "Checkpoint",
    "models.checkpoint.missing": "未登记",
    "models.source_repo": "源仓库",
    "models.source_repo.missing": "内置或未提供",
    "models.runtime_mode": "运行模式",
    "models.status": "可用性",
    "models.status.ready": "就绪",
    "models.status.not_ready": "未就绪",
    "models.resolved_source_repo": "已解析源码仓库",
    "models.configured_source_repo": "配置的源码仓库",
    "models.ready_issues": "阻塞问题",
    "runtime.chunk_size": "Chunk Size",
    "runtime.tokens_per_chunk": "每块 Tokens",
    "runtime.codebook_size": "码本大小",
    "doctor.empty.title": "尚未运行自检",
    "doctor.empty.desc": "保存环境设置后点击“重新检查环境”，即可查看当前系统状态。",
    "doctor.metric.python": "Python",
    "doctor.metric.platform": "平台",
    "doctor.metric.cache_root": "缓存目录",
    "doctor.metric.local_model_count": "本地模型数",
    "doctor.checks": "依赖检查",
    "doctor.check.ok": "{name}（就绪）",
    "doctor.check.error": "{name}（未就绪）",
    "doctor.hint.numpy": "请确认当前 Python 环境已经安装 `numpy`。",
    "doctor.hint.pod5": "请确认当前 Python 环境已经安装 `pod5` 相关依赖。",
    "doctor.hint.jax": "如果需要真实推理，请安装 `jax` 及其对应平台依赖。",
    "doctor.hint.flax": "如果需要真实推理，请补齐 `flax` 依赖后重新检查。",
    "doctor.hint.orbax.checkpoint": "如需加载 Orbax checkpoint，请安装 `orbax-checkpoint`。",
    "inspect.empty.title": "暂无探查结果",
    "inspect.empty.desc": "选择一个 bundle 并开始探查，这里会显示结构化摘要。",
    "inspect.metric.file": "文件",
    "inspect.metric.model": "模型",
    "inspect.metric.reads": "Reads",
    "inspect.metric.chunks": "Chunks",
    "inspect.metric.chunk_size": "Chunk Size",
    "inspect.metric.hop_size": "Hop Size",
    "inspect.model_chunking": "模型与分块",
    "inspect.packaging": "打包内容",
    "inspect.bundle_format": "Bundle 格式",
    "inspect.model_version": "模型版本",
    "inspect.source_mode": "来源模式",
    "inspect.short_policy": "短块策略",
    "inspect.packaging_kind": "打包方式",
    "inspect.inner_dir": "内部目录",
    "inspect.current_bundle": "当前 Bundle",
    "generic.version": "版本",
    "generic.variant": "Variant",
    "generic.mode": "模式",
    "generic.policy": "策略",
    "generic.none_registered": "未记录",
    "generic.no_error": "无",
    "generic.unknown": "未知",
    "generic.internal_or_missing": "内置或未提供",
    "workflow.model.placeholder": "请选择本地模型",
    "workflow.model.empty": "暂无本地模型，请先去“模型管理”页准备模型",
    "workflow.model.missing_suffix": "（当前值未在本地找到）",
    "message.settings.saved": "系统设置已保存。",
    "message.settings.refreshed": "系统自检已刷新。",
    "message.data.refreshed": "数据已刷新。",
    "message.models.remote_refreshed": "远程模型已刷新。",
    "message.models.local_refreshed": "本地模型已刷新。",
    "message.models.registered": "本地模型已注册。",
    "message.models.pulled": "模型 {name} 已拉取。",
    "message.models.removed": "模型 {name} 已删除。",
    "message.encode.started": "压缩任务已启动。",
    "message.decode.started": "重建任务已启动。",
    "message.inspect.done": "探查完成。",
    "message.preflight.model_missing": "请选择一个本地模型。",
    "message.preflight.model_not_ready": "当前模型还不能运行：{issue}",
    "message.preflight.missing_source_repo": "当前模型依赖外部 SimVQGAN 源码仓库。请先在系统设置中配置“模型源码仓库”，或重新注册该模型。",
    "dialog.settings.repo_root": "选择 SimVQ 仓库根目录",
    "dialog.settings.model_repo": "选择 SimVQGAN 源码仓库",
    "dialog.register.checkpoint": "选择 checkpoint 目录",
    "dialog.register.source_repo": "选择原始 SimVQGAN 仓库",
    "dialog.register.config_json": "选择配置 JSON",
    "dialog.encode.input": "选择 POD5",
    "dialog.encode.output": "保存输出 Bundle",
    "dialog.decode.input": "选择 Bundle",
    "dialog.decode.output": "保存输出 POD5",
    "dialog.inspect.input": "选择 Bundle",
    "dialog.filter.json": "JSON",
    "dialog.filter.pod5": "POD5",
    "dialog.filter.bundle": "SimVQ Bundle",
    "error.drag.read_path": "无法读取拖入文件的真实路径，请改用“选择文件”。",
    "error.drag.invalid_type": "文件类型不符合要求，请重新选择。",
    "error.model_source_repo_missing": "当前模型依赖的外部源码仓库不存在：{path}。请在系统设置中配置“模型源码仓库”，或重新注册该模型。",
    "error.model_source_repo_required": "真实模型需要一个兼容的 SimVQGAN 源码仓库。请在系统设置中配置“模型源码仓库”。",
    "error.configured_source_repo_missing": "模型配置里的源码仓库不存在：{path}。请在系统设置中配置“模型源码仓库”，或重新注册该模型。",
    "error.configured_source_repo_invalid": "模型配置里的源码仓库缺少 `codec.models`：{path}。请改用兼容的 SimVQGAN 仓库。",
    "error.model_builder_missing": "源码仓库中缺少 `codec.models.build_audio_model`：{path}。请改用兼容的 SimVQGAN 仓库。",
    "error.model_checkpoint_missing": "当前模型缺少 checkpoint 文件，请重新注册或重新拉取模型。",
    "error.task_interrupted_restart": "桌面端重启后，任务未继续执行。",
    "error.missing_field": "缺少必填字段：{field}",
    "error.repo_root_invalid": "当前 SimVQ 仓库根目录无效：{path}",
    "error.python_empty": "Python 可执行文件为空。",
  },
  en: {
    "app.window_title": "SimVQ Desktop",
    "brand.tagline": "A desktop workspace for compression and reconstruction",
    "nav.group.core": "Core Workflow",
    "nav.group.analysis": "Analysis",
    "nav.group.settings": "Settings",
    "nav.encode.title": "Encode",
    "nav.encode.subtitle": "Drop a POD5 file and start compression",
    "nav.decode.title": "Decode",
    "nav.decode.subtitle": "Restore a usable POD5 file from a bundle",
    "nav.tasks.title": "Task History",
    "nav.tasks.subtitle": "Check progress, results, and logs",
    "nav.inspect.title": "Inspect",
    "nav.inspect.subtitle": "Read key bundle metadata quickly",
    "nav.models.title": "Model Manager",
    "nav.models.subtitle": "View, pull, and maintain local models",
    "nav.home.title": "System Settings",
    "nav.home.subtitle": "Configure paths and run health checks",
    "toolbar.refresh_all": "Refresh All",
    "view.encode.title": "Encode",
    "view.encode.subtitle": "Drop a source file, choose a model, then start the background compression task.",
    "view.decode.title": "Decode",
    "view.decode.subtitle": "Choose a bundle and model, then reconstruct a usable POD5 file.",
    "view.tasks.title": "Task History",
    "view.tasks.subtitle": "Review recent task status, duration, outputs, and logs.",
    "view.inspect.title": "Inspect",
    "view.inspect.subtitle": "Read core bundle fields and understand model and chunking details quickly.",
    "view.models.title": "Model Manager",
    "view.models.subtitle": "View pullable models, maintain local models, and feed workflow dropdowns.",
    "view.home.title": "Environment & System Settings",
    "view.home.subtitle": "Configure runtime paths, model sources, and dependency health.",
    "settings.panel.title": "Environment & System Settings",
    "settings.panel.subtitle": "Configure runtime paths and model sources so the desktop app can run tasks reliably.",
    "settings.language.label": "Language",
    "settings.language.option.zh-CN": "Simplified Chinese",
    "settings.language.option.en": "English",
    "settings.python.label": "Python Executable",
    "settings.python.placeholder": "python3",
    "settings.repo_root.label": "SimVQ Repo Root",
    "settings.repo_root.placeholder": "/path/to/SimVQApp",
    "settings.repo_root.browse": "Browse",
    "settings.catalog_url.label": "Remote Model Catalog URL (optional)",
    "settings.catalog_url.placeholder": "https://example.com/catalog.json",
    "settings.model_repo.label": "Model Source Repo (optional for real models)",
    "settings.model_repo.placeholder": "/path/to/SimVQGAN",
    "settings.model_repo.browse": "Browse",
    "settings.save": "Save Settings",
    "settings.run_doctor": "Run Health Check",
    "doctor.panel.title": "System Health",
    "doctor.panel.subtitle": "Show readable dependency status by default and keep raw diagnostics in the developer view.",
    "doctor.raw": "View Raw Doctor JSON",
    "models.remote.title": "Available Remote Models",
    "models.remote.subtitle": "Surface pullable remote models first so deployment is quick.",
    "models.remote.placeholder": "Use the catalog URL from system settings",
    "models.remote.refresh": "Refresh Remote",
    "models.local.title": "Installed Local Models",
    "models.local.subtitle": "These models are available directly in Encode and Decode dropdowns.",
    "models.local.refresh": "Refresh Local",
    "models.detail.title": "Model Details",
    "models.detail.subtitle": "Show version, runtime parameters, and local paths first. Keep raw payload collapsed.",
    "models.detail.raw": "View Raw Model JSON",
    "models.register.toggle.title": "Register Local Model",
    "models.register.toggle.subtitle": "Expand only after your checkpoint is ready",
    "register.name.label": "Model Name",
    "register.name.placeholder": "simvq-v45-3x",
    "register.checkpoint.label": "Checkpoint Directory",
    "register.checkpoint.placeholder": "/path/to/checkpoint_1200000",
    "register.checkpoint.browse": "Browse",
    "register.source_repo.label": "Source Repo",
    "register.source_repo.placeholder": "/path/to/SimVQGAN",
    "register.source_repo.browse": "Browse",
    "register.config_json.label": "Config JSON",
    "register.config_json.placeholder": "/path/to/train.json",
    "register.config_json.browse": "Browse",
    "register.version.label": "Version (optional)",
    "register.version.placeholder": "1200000",
    "register.variant.label": "Variant",
    "register.overwrite": "Allow overwrite of an existing version",
    "register.submit": "Register Model",
    "encode.panel.title": "Encode Task",
    "encode.panel.subtitle": "Keep only input, output, and model visible by default. Hide the rest behind advanced settings.",
    "encode.field.input": "Input File",
    "encode.field.output": "Output Location",
    "encode.field.model": "Compression Model",
    "encode.model.hint": "Choose directly from locally registered models to avoid typing mistakes.",
    "encode.advanced": "Show Advanced Settings",
    "encode.batch": "Batch Size",
    "encode.chunk": "Chunk Size",
    "encode.hop": "Hop Size",
    "encode.short_policy": "Short Chunk Policy",
    "encode.overwrite": "Allow overwriting existing output",
    "encode.submit": "Start Encode",
    "guide.title": "How It Works",
    "guide.encode.1": "Drop a source file or click to choose a `.pod5` file.",
    "guide.encode.2": "Choose the matching compression model from local models.",
    "guide.encode.3": "Click start and the system will run the high-fidelity compression in the background.",
    "decode.panel.title": "Decode Task",
    "decode.panel.subtitle": "Restore a bundle to POD5 while keeping only the three most important inputs visible by default.",
    "decode.field.input": "Input Bundle",
    "decode.field.output": "Output Location",
    "decode.field.model": "Reconstruction Model",
    "decode.model.hint": "Only locally installed models are shown here so tasks can run directly.",
    "decode.advanced": "Show Advanced Settings",
    "decode.batch": "Batch Size",
    "decode.overwrite": "Allow overwriting existing output",
    "decode.submit": "Start Decode",
    "guide.decode.1": "Drop the bundle you want to restore.",
    "guide.decode.2": "Choose the local model that matches the bundle.",
    "guide.decode.3": "Click start and the system will reconstruct in the background and keep the result in history.",
    "inspect.panel.title": "Inspect Bundle",
    "inspect.panel.subtitle": "Read key bundle fields quickly so you can understand the contents before decoding.",
    "inspect.field.bundle": "Bundle File",
    "inspect.submit": "Inspect",
    "inspect.result.title": "Inspection Result",
    "inspect.result.subtitle": "Show only the fields normal users need first. Keep raw JSON behind a developer toggle.",
    "inspect.raw": "View Raw Manifest JSON",
    "tasks.panel.title": "Task History",
    "tasks.panel.subtitle": "Browse recent encode and decode tasks by type, file name, and status.",
    "tasks.refresh": "Refresh Tasks",
    "tasks.detail.title": "Task Details",
    "tasks.detail.subtitle": "Show duration, status, and outputs first. Keep raw JSON in the developer view.",
    "tasks.raw": "View Raw Result JSON",
    "tasks.log": "Run Log",
    "picker.choose_file": "Choose File",
    "picker.choose_location": "Choose Location",
    "picker.clear": "Clear",
    "picker.encode_input.kicker": "Input File",
    "picker.encode_input.empty_title": "Click to choose a file, or drop a .pod5 file here",
    "picker.encode_input.empty_description": "After selection, only the file name is shown. Hover to see the full path.",
    "picker.encode_input.filled_description": "POD5 input file",
    "picker.encode_output.kicker": "Output Location",
    "picker.encode_output.empty_title": "Choose where to save the compressed result",
    "picker.encode_output.empty_description": "The app can derive a `.vq.tar.gz` file name from the input automatically.",
    "picker.encode_output.filled_description": "Output bundle",
    "picker.decode_input.kicker": "Input File",
    "picker.decode_input.empty_title": "Click to choose a file, or drop a bundle here",
    "picker.decode_input.empty_description": "Supports `.vq.tar.gz` and `.vq`. Hover to see the full path.",
    "picker.decode_input.filled_description": "Bundle input file",
    "picker.decode_output.kicker": "Output Location",
    "picker.decode_output.empty_title": "Choose where to save the reconstructed result",
    "picker.decode_output.empty_description": "The app can derive a `.reconstructed.pod5` file name from the bundle automatically.",
    "picker.decode_output.filled_description": "Output POD5",
    "picker.inspect_input.kicker": "Target File",
    "picker.inspect_input.empty_title": "Click to choose a file, or drop a bundle here",
    "picker.inspect_input.empty_description": "After loading, only key fields are shown by default.",
    "picker.inspect_input.filled_description": "Bundle to inspect",
    "common.none": "—",
    "common.seconds_under_one": "Under 1 second",
    "common.hours_minutes": "{hours}h {minutes}m",
    "common.minutes_seconds": "{minutes}m {seconds}s",
    "common.seconds": "{seconds}s",
    "task.status.running": "Running",
    "task.status.cancelling": "Cancelling",
    "task.status.completed": "Completed",
    "task.status.failed": "Failed",
    "task.status.cancelled": "Cancelled",
    "task.status.interrupted": "Interrupted",
    "task.kind.encode": "Encode",
    "task.kind.decode": "Decode",
    "task.current": "Current Task",
    "task.select.empty.title": "No Task Selected",
    "task.select.empty.desc": "Choose a task from the left to view its summary and logs.",
    "task.list.empty.title": "No Tasks Yet",
    "task.list.empty.desc": "Task results and logs will appear here after you start Encode or Decode.",
    "task.detail.processing": "Running in the background",
    "task.detail.failed": "Task execution failed",
    "task.detail.completed": "{kind} completed",
    "task.metric.status": "Status",
    "task.metric.duration": "Duration",
    "task.metric.reads": "Reads",
    "task.metric.chunks": "Chunks",
    "task.metric.output_size": "Output Size",
    "task.metric.raw_size": "Raw Size",
    "task.metric.started_at": "Started",
    "task.metric.ended_at": "Ended",
    "task.core": "Core Info",
    "task.extra": "Additional Status",
    "task.input": "Input File",
    "task.output": "Output File",
    "task.created_at": "Created At",
    "task.error": "Error",
    "task.exit_code": "Exit Code",
    "task.action.cancel": "Cancel",
    "task.reveal": "Reveal Output",
    "task.open": "Open Output",
    "task.log.empty": "No logs yet.",
    "task.fallback_name": "{kind} task",
    "models.remote.empty.title": "No Remote Models",
    "models.remote.empty.desc": "Refresh the catalog or check the remote catalog URL in system settings.",
    "models.local.empty.title": "No Local Models",
    "models.local.empty.desc": "Pull a model first, or expand the form below to register an existing checkpoint.",
    "models.detail.empty.title": "No Model Selected",
    "models.detail.empty.desc": "Click “Details” on a local model to show version, runtime mode, and path information here.",
    "models.pull": "Pull",
    "models.show": "Details",
    "models.remove": "Remove",
    "models.version": "version {version}",
    "models.untagged_version": "unlabeled",
    "models.variant_missing": "variant not labeled",
    "models.cache": "Local Cache",
    "models.runtime": "Runtime Parameters",
    "models.local_dir": "Local Directory",
    "models.config_path": "Config File",
    "models.checkpoint": "Checkpoint",
    "models.checkpoint.missing": "not recorded",
    "models.source_repo": "Source Repo",
    "models.source_repo.missing": "built-in or missing",
    "models.runtime_mode": "Runtime Mode",
    "models.status": "Readiness",
    "models.status.ready": "Ready",
    "models.status.not_ready": "Not Ready",
    "models.resolved_source_repo": "Resolved Source Repo",
    "models.configured_source_repo": "Configured Source Repo",
    "models.ready_issues": "Blocking Issues",
    "runtime.chunk_size": "Chunk Size",
    "runtime.tokens_per_chunk": "Tokens per Chunk",
    "runtime.codebook_size": "Codebook Size",
    "doctor.empty.title": "Health Check Not Run Yet",
    "doctor.empty.desc": "Save your environment settings, then click “Run Health Check” to view the current system state.",
    "doctor.metric.python": "Python",
    "doctor.metric.platform": "Platform",
    "doctor.metric.cache_root": "Cache Root",
    "doctor.metric.local_model_count": "Local Models",
    "doctor.checks": "Dependency Checks",
    "doctor.check.ok": "{name} (ready)",
    "doctor.check.error": "{name} (not ready)",
    "doctor.hint.numpy": "Make sure `numpy` is installed in the current Python environment.",
    "doctor.hint.pod5": "Make sure the current Python environment has the `pod5` dependencies installed.",
    "doctor.hint.jax": "Install `jax` and the matching platform dependencies for real inference.",
    "doctor.hint.flax": "Install `flax` before running the health check again.",
    "doctor.hint.orbax.checkpoint": "Install `orbax-checkpoint` if you need to load Orbax checkpoints.",
    "inspect.empty.title": "No Inspection Result",
    "inspect.empty.desc": "Choose a bundle and start inspection to see a structured summary here.",
    "inspect.metric.file": "File",
    "inspect.metric.model": "Model",
    "inspect.metric.reads": "Reads",
    "inspect.metric.chunks": "Chunks",
    "inspect.metric.chunk_size": "Chunk Size",
    "inspect.metric.hop_size": "Hop Size",
    "inspect.model_chunking": "Model & Chunking",
    "inspect.packaging": "Packaging",
    "inspect.bundle_format": "Bundle Format",
    "inspect.model_version": "Model Version",
    "inspect.source_mode": "Source Mode",
    "inspect.short_policy": "Short Chunk Policy",
    "inspect.packaging_kind": "Packaging Kind",
    "inspect.inner_dir": "Inner Directory",
    "inspect.current_bundle": "Current Bundle",
    "generic.version": "Version",
    "generic.variant": "Variant",
    "generic.mode": "Mode",
    "generic.policy": "Policy",
    "generic.none_registered": "not recorded",
    "generic.no_error": "none",
    "generic.unknown": "unknown",
    "generic.internal_or_missing": "built-in or missing",
    "workflow.model.placeholder": "Choose a local model",
    "workflow.model.empty": "No local models yet. Open Model Manager first.",
    "workflow.model.missing_suffix": " (current value not found locally)",
    "message.settings.saved": "System settings saved.",
    "message.settings.refreshed": "Health check refreshed.",
    "message.data.refreshed": "Data refreshed.",
    "message.models.remote_refreshed": "Remote models refreshed.",
    "message.models.local_refreshed": "Local models refreshed.",
    "message.models.registered": "Local model registered.",
    "message.models.pulled": "Model {name} pulled.",
    "message.models.removed": "Model {name} removed.",
    "message.encode.started": "Encode task started.",
    "message.decode.started": "Decode task started.",
    "message.inspect.done": "Inspection finished.",
    "message.preflight.model_missing": "Choose a local model first.",
    "message.preflight.model_not_ready": "This model is not ready to run: {issue}",
    "message.preflight.missing_source_repo": "This model depends on an external SimVQGAN source repo. Set “Model Source Repo” in System Settings or re-register the model.",
    "dialog.settings.repo_root": "Choose SimVQ repo root",
    "dialog.settings.model_repo": "Choose SimVQGAN source repo",
    "dialog.register.checkpoint": "Choose checkpoint directory",
    "dialog.register.source_repo": "Choose original SimVQGAN repo",
    "dialog.register.config_json": "Choose config JSON",
    "dialog.encode.input": "Choose POD5",
    "dialog.encode.output": "Save output bundle",
    "dialog.decode.input": "Choose bundle",
    "dialog.decode.output": "Save output POD5",
    "dialog.inspect.input": "Choose bundle",
    "dialog.filter.json": "JSON",
    "dialog.filter.pod5": "POD5",
    "dialog.filter.bundle": "SimVQ Bundle",
    "error.drag.read_path": "Unable to read the real path of the dropped file. Use “Choose File” instead.",
    "error.drag.invalid_type": "The dropped file type is not supported here.",
    "error.model_source_repo_missing": "The external source repo required by this model does not exist: {path}. Set “Model Source Repo” in System Settings or re-register the model.",
    "error.model_source_repo_required": "A compatible SimVQGAN source repo is required for real models. Set it in System Settings first.",
    "error.configured_source_repo_missing": "The source repo recorded in the model config does not exist: {path}. Set “Model Source Repo” in System Settings or re-register the model.",
    "error.configured_source_repo_invalid": "The source repo recorded in the model config is missing `codec.models`: {path}. Use a compatible SimVQGAN repo instead.",
    "error.model_builder_missing": "`codec.models.build_audio_model` was not found under: {path}. Use a compatible SimVQGAN repo instead.",
    "error.model_checkpoint_missing": "This model is missing its checkpoint. Re-register or pull the model again.",
    "error.task_interrupted_restart": "The desktop app restarted before the task could continue.",
    "error.missing_field": "Missing required field: {field}",
    "error.repo_root_invalid": "The current SimVQ repo root is invalid: {path}",
    "error.python_empty": "Python executable is empty.",
  },
};

const VIEW_KEYS = {
  encode: {
    title: "view.encode.title",
    subtitle: "view.encode.subtitle",
  },
  decode: {
    title: "view.decode.title",
    subtitle: "view.decode.subtitle",
  },
  tasks: {
    title: "view.tasks.title",
    subtitle: "view.tasks.subtitle",
  },
  inspect: {
    title: "view.inspect.title",
    subtitle: "view.inspect.subtitle",
  },
  models: {
    title: "view.models.title",
    subtitle: "view.models.subtitle",
  },
  home: {
    title: "view.home.title",
    subtitle: "view.home.subtitle",
  },
};

const TASK_STATUS_KEYS = {
  running: "task.status.running",
  cancelling: "task.status.cancelling",
  completed: "task.status.completed",
  failed: "task.status.failed",
  cancelled: "task.status.cancelled",
  interrupted: "task.status.interrupted",
};

const TASK_KIND_KEYS = {
  encode: "task.kind.encode",
  decode: "task.kind.decode",
};

const TASK_KIND_ICONS = {
  encode: "压",
  decode: "建",
};

const DOCTOR_CHECK_LABELS = {
  numpy: "NumPy",
  pod5: "POD5",
  jax: "JAX",
  flax: "Flax",
  "orbax.checkpoint": "Orbax Checkpoint",
};

const DOCTOR_FIX_HINT_KEYS = {
  numpy: "doctor.hint.numpy",
  pod5: "doctor.hint.pod5",
  jax: "doctor.hint.jax",
  flax: "doctor.hint.flax",
  "orbax.checkpoint": "doctor.hint.orbax.checkpoint",
};

const FILE_PICKER_CONFIG = {
  "encode-input": {
    icon: "压",
    kickerKey: "picker.encode_input.kicker",
    emptyTitleKey: "picker.encode_input.empty_title",
    emptyDescriptionKey: "picker.encode_input.empty_description",
    filledDescriptionKey: "picker.encode_input.filled_description",
    allowDrop: true,
    extensions: [".pod5"],
    messageId: "encode-message",
  },
  "encode-output": {
    icon: "出",
    kickerKey: "picker.encode_output.kicker",
    emptyTitleKey: "picker.encode_output.empty_title",
    emptyDescriptionKey: "picker.encode_output.empty_description",
    filledDescriptionKey: "picker.encode_output.filled_description",
    allowDrop: false,
  },
  "decode-input": {
    icon: "建",
    kickerKey: "picker.decode_input.kicker",
    emptyTitleKey: "picker.decode_input.empty_title",
    emptyDescriptionKey: "picker.decode_input.empty_description",
    filledDescriptionKey: "picker.decode_input.filled_description",
    allowDrop: true,
    extensions: [".vq.tar.gz", ".tar.gz", ".vq", ".gz"],
    messageId: "decode-message",
  },
  "decode-output": {
    icon: "出",
    kickerKey: "picker.decode_output.kicker",
    emptyTitleKey: "picker.decode_output.empty_title",
    emptyDescriptionKey: "picker.decode_output.empty_description",
    filledDescriptionKey: "picker.decode_output.filled_description",
    allowDrop: false,
  },
  "inspect-input": {
    icon: "查",
    kickerKey: "picker.inspect_input.kicker",
    emptyTitleKey: "picker.inspect_input.empty_title",
    emptyDescriptionKey: "picker.inspect_input.empty_description",
    filledDescriptionKey: "picker.inspect_input.filled_description",
    allowDrop: true,
    extensions: [".vq.tar.gz", ".tar.gz", ".vq", ".gz"],
    messageId: "inspect-message",
  },
};

const MODEL_SELECT_IDS = ["encode-model", "decode-model"];

const state = {
  settings: null,
  doctor: null,
  localModels: [],
  remoteModels: [],
  selectedModelPayload: null,
  inspectResult: null,
  inspectSourcePath: "",
  tasks: [],
  selectedTaskId: null,
  activeView: "encode",
};

const STATIC_TEXT_BINDINGS = [
  [".brand-copy p", "brand.tagline"],
  [".nav-group:nth-of-type(1) .nav-group-label", "nav.group.core"],
  ['[data-view-target="encode"] .nav-copy strong', "nav.encode.title"],
  ['[data-view-target="encode"] .nav-copy small', "nav.encode.subtitle"],
  ['[data-view-target="decode"] .nav-copy strong', "nav.decode.title"],
  ['[data-view-target="decode"] .nav-copy small', "nav.decode.subtitle"],
  [".nav-group:nth-of-type(2) .nav-group-label", "nav.group.analysis"],
  ['[data-view-target="tasks"] .nav-copy strong', "nav.tasks.title"],
  ['[data-view-target="tasks"] .nav-copy small', "nav.tasks.subtitle"],
  ['[data-view-target="inspect"] .nav-copy strong', "nav.inspect.title"],
  ['[data-view-target="inspect"] .nav-copy small', "nav.inspect.subtitle"],
  [".nav-group:nth-of-type(3) .nav-group-label", "nav.group.settings"],
  ['[data-view-target="models"] .nav-copy strong', "nav.models.title"],
  ['[data-view-target="models"] .nav-copy small', "nav.models.subtitle"],
  ['[data-view-target="home"] .nav-copy strong', "nav.home.title"],
  ['[data-view-target="home"] .nav-copy small', "nav.home.subtitle"],
  ["#refresh-all-button", "toolbar.refresh_all"],
  ["#view-home .panel:first-child h3", "settings.panel.title"],
  ["#view-home .panel:first-child .panel-subtle", "settings.panel.subtitle"],
  ['label[for="settings-language"], #settings-form label:nth-of-type(1) > span', "settings.language.label"],
  ['#settings-form label:nth-of-type(2) > span', "settings.python.label"],
  ['#settings-form label:nth-of-type(3) > span', "settings.repo_root.label"],
  ["#settings-repo-browse", "settings.repo_root.browse"],
  ['#settings-form label:nth-of-type(4) > span', "settings.catalog_url.label"],
  ['#settings-form label:nth-of-type(5) > span', "settings.model_repo.label"],
  ["#settings-model-source-repo-browse", "settings.model_repo.browse"],
  ['#settings-form button[type="submit"]', "settings.save"],
  ["#doctor-run-button", "settings.run_doctor"],
  ["#view-home .panel.panel-data h3", "doctor.panel.title"],
  ["#view-home .panel.panel-data .panel-subtle", "doctor.panel.subtitle"],
  ['#view-home .debug-section summary', "doctor.raw"],
  ["#view-models .layout-split .panel:first-child h3", "models.remote.title"],
  ["#view-models .layout-split .panel:first-child .panel-subtle", "models.remote.subtitle"],
  ["#models-refresh-remote", "models.remote.refresh"],
  ["#view-models .layout-split .panel:nth-child(2) h3", "models.local.title"],
  ["#view-models .layout-split .panel:nth-child(2) .panel-subtle", "models.local.subtitle"],
  ["#models-refresh-local", "models.local.refresh"],
  ["#view-models .layout-single .panel-data h3", "models.detail.title"],
  ["#view-models .layout-single .panel-data .panel-subtle", "models.detail.subtitle"],
  ['#view-models .layout-single .panel-data .debug-section summary', "models.detail.raw"],
  [".panel-collapse > summary > span", "models.register.toggle.title"],
  [".panel-collapse > summary > small", "models.register.toggle.subtitle"],
  ['#register-model-form label:nth-of-type(1) > span', "register.name.label"],
  ['#register-model-form label:nth-of-type(2) > span', "register.checkpoint.label"],
  ["#register-checkpoint-browse", "register.checkpoint.browse"],
  ['#register-model-form label:nth-of-type(3) > span', "register.source_repo.label"],
  ["#register-source-repo-browse", "register.source_repo.browse"],
  ['#register-model-form label:nth-of-type(4) > span', "register.config_json.label"],
  ["#register-config-json-browse", "register.config_json.browse"],
  ['#register-model-form .grid.two label:nth-of-type(1) > span', "register.version.label"],
  ['#register-model-form .grid.two label:nth-of-type(2) > span', "register.variant.label"],
  ['#register-model-form .checkbox span', "register.overwrite"],
  ['#register-model-form button[type="submit"]', "register.submit"],
  ["#view-encode .panel h3", "encode.panel.title"],
  ["#view-encode .panel .panel-subtle", "encode.panel.subtitle"],
  ['#view-encode .field-group:nth-of-type(1) .field-label', "encode.field.input"],
  ['#encode-input-browse', "picker.choose_file"],
  ['[data-picker-clear="encode-input"]', "picker.clear"],
  ['#view-encode .field-group:nth-of-type(2) .field-label', "encode.field.output"],
  ['#encode-output-browse', "picker.choose_location"],
  ['[data-picker-clear="encode-output"]', "picker.clear"],
  ['label[for="encode-model"], #encode-form > label > span', "encode.field.model"],
  ['#view-encode .field-hint', "encode.model.hint"],
  ['#view-encode .advanced-panel > summary', "encode.advanced"],
  ['#encode-form .grid.three label:nth-of-type(1) > span', "encode.batch"],
  ['#encode-form .grid.three label:nth-of-type(2) > span', "encode.chunk"],
  ['#encode-form .grid.three label:nth-of-type(3) > span', "encode.hop"],
  ['#encode-form .advanced-panel-body > label:nth-of-type(1) > span', "encode.short_policy"],
  ['#encode-form .advanced-panel-body .checkbox span', "encode.overwrite"],
  ['#encode-form button.primary-button', "encode.submit"],
  ["#view-encode .helper-note h3", "guide.title"],
  ['#view-encode .guide-list li:nth-of-type(1)', "guide.encode.1"],
  ['#view-encode .guide-list li:nth-of-type(2)', "guide.encode.2"],
  ['#view-encode .guide-list li:nth-of-type(3)', "guide.encode.3"],
  ["#view-decode .panel h3", "decode.panel.title"],
  ["#view-decode .panel .panel-subtle", "decode.panel.subtitle"],
  ['#view-decode .field-group:nth-of-type(1) .field-label', "decode.field.input"],
  ['#decode-input-browse', "picker.choose_file"],
  ['[data-picker-clear="decode-input"]', "picker.clear"],
  ['#view-decode .field-group:nth-of-type(2) .field-label', "decode.field.output"],
  ['#decode-output-browse', "picker.choose_location"],
  ['[data-picker-clear="decode-output"]', "picker.clear"],
  ['#decode-form > label > span', "decode.field.model"],
  ['#view-decode .field-hint', "decode.model.hint"],
  ['#view-decode .advanced-panel > summary', "decode.advanced"],
  ['#decode-form .advanced-panel-body > label:nth-of-type(1) > span', "decode.batch"],
  ['#decode-form .advanced-panel-body .checkbox span', "decode.overwrite"],
  ['#decode-form button.primary-button', "decode.submit"],
  ["#view-decode .helper-note h3", "guide.title"],
  ['#view-decode .guide-list li:nth-of-type(1)', "guide.decode.1"],
  ['#view-decode .guide-list li:nth-of-type(2)', "guide.decode.2"],
  ['#view-decode .guide-list li:nth-of-type(3)', "guide.decode.3"],
  ["#view-inspect .panel:first-child h3", "inspect.panel.title"],
  ["#view-inspect .panel:first-child .panel-subtle", "inspect.panel.subtitle"],
  ['#view-inspect .field-label', "inspect.field.bundle"],
  ["#inspect-input-browse", "picker.choose_file"],
  ['[data-picker-clear="inspect-input"]', "picker.clear"],
  ['#inspect-form button[type="submit"]', "inspect.submit"],
  ["#view-inspect .panel.panel-data h3", "inspect.result.title"],
  ["#view-inspect .panel.panel-data .panel-subtle", "inspect.result.subtitle"],
  ['#view-inspect .debug-section summary', "inspect.raw"],
  ["#view-tasks .panel:first-child h3", "tasks.panel.title"],
  ["#view-tasks .panel:first-child .panel-subtle", "tasks.panel.subtitle"],
  ["#tasks-refresh-button", "tasks.refresh"],
  ["#view-tasks .panel.panel-data h3", "tasks.detail.title"],
  ["#view-tasks .panel.panel-data .panel-subtle", "tasks.detail.subtitle"],
  ['#view-tasks .debug-section summary', "tasks.raw"],
  [".log-panel-header", "tasks.log"],
];

const STATIC_PLACEHOLDER_BINDINGS = [
  ["#settings-python", "settings.python.placeholder"],
  ["#settings-repo-root", "settings.repo_root.placeholder"],
  ["#settings-catalog-url", "settings.catalog_url.placeholder"],
  ["#settings-model-source-repo", "settings.model_repo.placeholder"],
  ["#models-catalog-url", "models.remote.placeholder"],
  ["#register-name", "register.name.placeholder"],
  ["#register-checkpoint", "register.checkpoint.placeholder"],
  ["#register-source-repo", "register.source_repo.placeholder"],
  ["#register-config-json", "register.config_json.placeholder"],
  ["#register-version", "register.version.placeholder"],
];

const STATIC_OPTION_BINDINGS = [
  ['#settings-language option[value="zh-CN"]', "settings.language.option.zh-CN"],
  ['#settings-language option[value="en"]', "settings.language.option.en"],
];

function normalizeLanguage(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) {
    return "zh-CN";
  }
  if (raw === "en" || raw === "en-us" || raw === "en-gb") {
    return "en";
  }
  if (raw === "zh" || raw === "zh-cn" || raw === "zh-hans") {
    return "zh-CN";
  }
  return "zh-CN";
}

function currentLanguage() {
  return normalizeLanguage(state.settings?.language || "zh-CN");
}

function t(key, replacements = {}) {
  const lang = currentLanguage();
  const fallback = TRANSLATIONS["zh-CN"] || {};
  let text = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || fallback[key] || key;
  for (const [name, value] of Object.entries(replacements)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLanguage();
  document.title = t("app.window_title");

  for (const [selector, key] of STATIC_TEXT_BINDINGS) {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = t(key);
    });
  }

  for (const [selector, key] of STATIC_PLACEHOLDER_BINDINGS) {
    document.querySelectorAll(selector).forEach((node) => {
      if (node instanceof HTMLInputElement) {
        node.placeholder = t(key);
      }
    });
  }

  for (const [selector, key] of STATIC_OPTION_BINDINGS) {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = t(key);
    });
  }
}

function humanizeErrorMessage(message) {
  const text = String(message || "").trim();
  if (!text) {
    return "";
  }

  let match = text.match(/^error:\s*Model source repo does not exist:\s*(.+)$/i);
  if (match) {
    return t("error.model_source_repo_missing", { path: match[1] });
  }

  match = text.match(/^Model source repo does not exist:\s*(.+)$/i);
  if (match) {
    return t("error.model_source_repo_missing", { path: match[1] });
  }

  match = text.match(/^Configured source repo does not exist:\s*(.+)$/i);
  if (match) {
    return t("error.configured_source_repo_missing", { path: match[1] });
  }

  match = text.match(/^Configured source repo is missing codec\.models:\s*(.+)$/i);
  if (match) {
    return t("error.configured_source_repo_invalid", { path: match[1] });
  }

  match = text.match(/^codec\.models\.build_audio_model not found under\s+(.+)$/i);
  if (match) {
    return t("error.model_builder_missing", { path: match[1] });
  }

  if (/Real JAX runtime requires a compatible SimVQGAN source repo/i.test(text)) {
    return t("error.model_source_repo_required");
  }

  if (/A compatible SimVQGAN source repo is required for this model/i.test(text)) {
    return t("error.model_source_repo_required");
  }

  if (/^Checkpoint path is missing\.?$/i.test(text)) {
    return t("error.model_checkpoint_missing");
  }

  if (/^Desktop app restarted before the task could continue\.?$/i.test(text) || text === "桌面端重启，任务未继续执行。") {
    return t("error.task_interrupted_restart");
  }

  match = text.match(/^Missing required field:\s*(.+)$/i);
  if (match) {
    return t("error.missing_field", { field: match[1] });
  }

  match = text.match(/^SimVQ repoRoot is invalid:\s*(.+)$/i);
  if (match) {
    return t("error.repo_root_invalid", { path: match[1] });
  }

  if (/Python executable is empty/i.test(text)) {
    return t("error.python_empty");
  }

  return text;
}

function $(selector) {
  return document.querySelector(selector);
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatJson(value) {
  return value ? JSON.stringify(value, null, 2) : "";
}

function displayValue(value, fallback = t("common.none")) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
}

function formatBytes(bytes) {
  if (!Number.isFinite(Number(bytes))) {
    return t("common.none");
  }
  const value = Number(bytes);
  const units = ["B", "KB", "MB", "GB"];
  let current = value;
  let unitIndex = 0;
  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }
  return `${current.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function formatDateTime(value) {
  if (!value) {
    return t("common.none");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString(currentLanguage() === "en" ? "en-US" : "zh-CN");
}

function formatDuration(startValue, endValue) {
  if (!startValue) {
    return t("common.none");
  }
  const start = new Date(startValue).getTime();
  const end = endValue ? new Date(endValue).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return t("common.none");
  }
  const totalSeconds = Math.max(0, Math.round((end - start) / 1000));
  if (totalSeconds < 1) {
    return t("common.seconds_under_one");
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) {
    return t("common.hours_minutes", { hours, minutes });
  }
  if (minutes) {
    return t("common.minutes_seconds", { minutes, seconds });
  }
  return t("common.seconds", { seconds });
}

function pathLeaf(value, fallback = "") {
  const text = String(value || "").trim();
  if (!text) {
    return fallback;
  }
  const parts = text.split(/[\\/]/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : text;
}

function emptyState(icon, title, description) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${escapeHtml(icon)}</div>
      <div class="empty-state-title">${escapeHtml(title)}</div>
      <p class="empty-state-text">${escapeHtml(description)}</p>
    </div>
  `;
}

function renderInfoRows(rows) {
  return rows
    .map(
      (row) => `
        <div class="info-row">
          <span class="info-label">${escapeHtml(row.label)}</span>
          <strong class="info-value${row.mono ? " mono" : ""}">${escapeHtml(displayValue(row.value, row.fallback))}</strong>
        </div>
      `
    )
    .join("");
}

function renderMetricCards(items, extraClass = "") {
  return `
    <div class="metric-grid ${extraClass}">
      ${items
        .map(
          (item) => `
            <div class="metric-card">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(displayValue(item.value, item.fallback))}</strong>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderPills(items) {
  return items
    .filter(Boolean)
    .map((item) => `<span class="meta-pill">${escapeHtml(item)}</span>`)
    .join("");
}

function renderPathList(items) {
  const entries = Array.isArray(items) ? items : [items];
  return `
    <div class="path-list">
      ${entries
        .filter((item) => item !== undefined && item !== null && item !== "")
        .map((item) => `<div class="path-pill mono">${escapeHtml(String(item))}</div>`)
        .join("")}
    </div>
  `;
}

function updateHeader(viewName) {
  const entry = VIEW_KEYS[viewName];
  if (!entry) {
    return;
  }
  $("#view-title").textContent = t(entry.title);
  $("#view-subtitle").textContent = t(entry.subtitle);
}

function activateView(viewName) {
  state.activeView = viewName;
  document.querySelectorAll(".view").forEach((node) => node.classList.remove("active"));
  document.querySelectorAll(".nav-button").forEach((node) => node.classList.remove("active"));
  const view = document.getElementById(`view-${viewName}`);
  const button = document.querySelector(`[data-view-target="${viewName}"]`);
  if (view) {
    view.classList.add("active");
  }
  if (button) {
    button.classList.add("active");
  }
  updateHeader(viewName);
}

function setMessage(elementId, text, tone = "info") {
  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }
  const finalText = tone === "error" ? humanizeErrorMessage(text) : text;
  element.textContent = finalText || "";
  element.className = `message ${tone}`;
}

function clearMessage(elementId) {
  setMessage(elementId, "", "info");
}

function currentCatalogUrl() {
  const field = $("#models-catalog-url");
  const raw = field ? field.value.trim() : "";
  return raw || (state.settings ? state.settings.catalogUrl : "") || "";
}

function guessEncodeOutput(inputPath) {
  if (!inputPath) {
    return "";
  }
  return inputPath.replace(/\.pod5$/i, "") + ".vq.tar.gz";
}

function guessDecodeOutput(inputPath) {
  if (!inputPath) {
    return "";
  }
  return inputPath.replace(/\.vq(?:\.tar\.gz)?$/i, "") + ".reconstructed.pod5";
}

function getLocalModelNames() {
  return Array.from(
    new Set(
      (state.localModels || [])
        .map((item) => item.name)
        .filter(Boolean)
    )
  ).sort();
}

function renderWorkflowModelSelects() {
  const names = getLocalModelNames();
  for (const selectId of MODEL_SELECT_IDS) {
    const select = document.getElementById(selectId);
    if (!select) {
      continue;
    }
    const current = String(select.value || "").trim();
    const options = names.slice();
    if (current && !options.includes(current)) {
      options.unshift(current);
    }
    const placeholder = options.length ? t("workflow.model.placeholder") : t("workflow.model.empty");
    select.innerHTML = [
      `<option value="">${escapeHtml(placeholder)}</option>`,
      ...options.map((name) => {
        const suffix = current && name === current && !names.includes(name) ? t("workflow.model.missing_suffix") : "";
        return `<option value="${escapeHtml(name)}">${escapeHtml(name + suffix)}</option>`;
      }),
    ].join("");
    if (current && options.includes(current)) {
      select.value = current;
    } else if (names.length) {
      select.value = names[0];
    } else {
      select.value = "";
    }
    select.disabled = !options.length;
  }
}

function renderFilePicker(fieldId) {
  const config = FILE_PICKER_CONFIG[fieldId];
  const input = document.getElementById(fieldId);
  const card = document.querySelector(`[data-file-picker="${fieldId}"]`);
  if (!config || !input || !card) {
    return;
  }
  const value = String(input.value || "").trim();
  const hasValue = Boolean(value);
  card.dataset.hasValue = hasValue ? "true" : "false";
  card.title = hasValue ? value : "";

  const icon = card.querySelector("[data-picker-icon]");
  const kicker = card.querySelector("[data-picker-kicker]");
  const title = card.querySelector("[data-picker-title]");
  const description = card.querySelector("[data-picker-description]");
  const clearButton = card.querySelector(`[data-picker-clear="${fieldId}"]`);

  if (icon) {
    icon.textContent = config.icon;
  }
  if (kicker) {
    kicker.textContent = t(config.kickerKey);
  }
  if (title) {
    title.textContent = hasValue ? pathLeaf(value) : t(config.emptyTitleKey);
  }
  if (description) {
    description.textContent = hasValue ? t(config.filledDescriptionKey) : t(config.emptyDescriptionKey);
  }
  if (clearButton) {
    clearButton.disabled = !hasValue;
  }
}

function renderAllFilePickers() {
  Object.keys(FILE_PICKER_CONFIG).forEach(renderFilePicker);
}

function setFieldValue(fieldId, value) {
  const input = document.getElementById(fieldId);
  if (!input) {
    return;
  }
  input.value = value || "";
  renderFilePicker(fieldId);
}

function clearFieldValue(fieldId) {
  setFieldValue(fieldId, "");
}

function applySelectedPath(fieldId, value) {
  if (!value) {
    return;
  }
  setFieldValue(fieldId, value);
  if (fieldId === "encode-input" && !$("#encode-output").value.trim()) {
    setFieldValue("encode-output", guessEncodeOutput(value));
  }
  if (fieldId === "decode-input" && !$("#decode-output").value.trim()) {
    setFieldValue("decode-output", guessDecodeOutput(value));
  }
}

function normalizeCheckMessage(value) {
  return String(value || "").replace(/^missing:\s*/i, "").trim();
}

function doctorCheckLabel(name) {
  return DOCTOR_CHECK_LABELS[name] || name;
}

function doctorCheckText(name, value) {
  const ok = String(value).trim().toLowerCase() === "ok";
  if (ok) {
    return `${doctorCheckLabel(name)} ${currentLanguage() === "en" ? "is ready for related tasks." : "已就绪，可直接用于相关任务。"}`;
  }
  const reason =
    normalizeCheckMessage(value) ||
    (currentLanguage() === "en" ? "The dependency is missing from the current environment." : "当前环境未找到对应依赖。");
  const hint =
    (DOCTOR_FIX_HINT_KEYS[name] && t(DOCTOR_FIX_HINT_KEYS[name])) ||
    (currentLanguage() === "en"
      ? "Check the current Python environment and run the health check again."
      : "请检查当前 Python 环境后重新运行自检。");
  return currentLanguage() === "en" ? `${reason}. ${hint}` : `${reason}。${hint}`;
}

function renderSettingsForm() {
  if (!state.settings) {
    return;
  }
  $("#settings-language").value = normalizeLanguage(state.settings.language);
  $("#settings-python").value = state.settings.pythonExecutable || "";
  $("#settings-repo-root").value = state.settings.repoRoot || "";
  $("#settings-catalog-url").value = state.settings.catalogUrl || "";
  $("#settings-model-source-repo").value = state.settings.modelSourceRepo || "";
  $("#models-catalog-url").value = state.settings.catalogUrl || "";
  if (!$("#register-source-repo").value.trim() && state.settings.modelSourceRepo) {
    $("#register-source-repo").value = state.settings.modelSourceRepo;
  }
  applyStaticTranslations();
  updateHeader(state.activeView);
}

function renderDoctor() {
  const summary = $("#doctor-summary");
  const raw = $("#doctor-json");
  raw.textContent = formatJson(state.doctor);
  if (!state.doctor) {
    summary.className = "doctor-summary empty-state-host";
    summary.innerHTML = emptyState("◌", t("doctor.empty.title"), t("doctor.empty.desc"));
    return;
  }

  const checkRows = Object.entries(state.doctor.checks || {})
    .map(([name, value]) => {
      const ok = String(value).trim().toLowerCase() === "ok";
      return `
        <div class="health-row ${ok ? "ok" : "error"}">
          <span class="health-icon">${ok ? "✓" : "!"}</span>
          <div class="health-copy">
            <strong>${escapeHtml(
              ok
                ? t("doctor.check.ok", { name: doctorCheckLabel(name) })
                : t("doctor.check.error", { name: doctorCheckLabel(name) })
            )}</strong>
            <span>${escapeHtml(doctorCheckText(name, value))}</span>
          </div>
        </div>
      `;
    })
    .join("");

  summary.className = "doctor-summary";
  summary.innerHTML = `
    <div class="summary-stack">
      ${renderMetricCards([
        { label: t("doctor.metric.python"), value: state.doctor.python },
        { label: t("doctor.metric.platform"), value: state.doctor.platform },
        { label: t("doctor.metric.cache_root"), value: state.doctor.cache_root },
        { label: t("doctor.metric.local_model_count"), value: state.doctor.local_model_count },
      ])}
      <section class="detail-block">
        <h4>${escapeHtml(t("doctor.checks"))}</h4>
        <div class="health-list">${checkRows}</div>
      </section>
    </div>
  `;
}

function renderRemoteModels() {
  const container = $("#remote-models-list");
  if (!state.remoteModels.length) {
    container.className = "card-list empty-state-host";
    container.innerHTML = emptyState("⌁", t("models.remote.empty.title"), t("models.remote.empty.desc"));
    return;
  }
  container.className = "card-list";
  container.innerHTML = state.remoteModels
    .map(
      (item) => `
        <div class="model-card">
          <div class="model-card-main">
            <span class="model-kind-icon">远</span>
            <div class="card-copy">
              <div class="card-title-row">
                <div class="card-title">${escapeHtml(item.name)}</div>
                <div class="pill-row">${renderPills([item.variant, item.mode])}</div>
              </div>
              <div class="card-meta">${escapeHtml(t("models.version", { version: displayValue(item.version, t("models.untagged_version")) }))}</div>
            </div>
          </div>
          <div class="button-row compact">
            <button type="button" data-model-action="pull" data-model-name="${escapeHtml(item.name)}">${escapeHtml(t("models.pull"))}</button>
          </div>
        </div>
      `
    )
    .join("");
}

function renderLocalModels() {
  const container = $("#local-models-list");
  if (!state.localModels.length) {
    container.className = "card-list empty-state-host";
    container.innerHTML = emptyState("◍", t("models.local.empty.title"), t("models.local.empty.desc"));
    return;
  }
  container.className = "card-list";
  container.innerHTML = state.localModels
    .map(
      (item) => `
        <div class="model-card">
          <div class="model-card-main">
            <span class="model-kind-icon">本</span>
            <div class="card-copy">
              <div class="card-title-row">
                <div class="card-title">${escapeHtml(item.name)}</div>
                <div class="pill-row">${renderPills([item.version, item.mode])}</div>
              </div>
              <div class="card-meta">${escapeHtml(displayValue(item.variant, t("models.variant_missing")))}</div>
              <div class="card-path mono">${escapeHtml(displayValue(item.local_dir))}</div>
            </div>
          </div>
          <div class="button-row compact">
            <button type="button" data-model-action="show" data-model-name="${escapeHtml(item.name)}">${escapeHtml(t("models.show"))}</button>
            <button type="button" data-model-action="remove" data-model-name="${escapeHtml(item.name)}" class="danger-button">${escapeHtml(t("models.remove"))}</button>
          </div>
        </div>
      `
    )
    .join("");
}

function renderModelDetail() {
  const summary = $("#model-detail-summary");
  const raw = $("#model-detail-json");
  raw.textContent = formatJson(state.selectedModelPayload);
  if (!state.selectedModelPayload) {
    summary.className = "detail-summary empty-state-host";
    summary.innerHTML = emptyState("◇", t("models.detail.empty.title"), t("models.detail.empty.desc"));
    return;
  }

  const payload = state.selectedModelPayload;
  const runtime = payload.runtime || {};
  const readinessIssues = Array.isArray(runtime.issues) ? runtime.issues.map(humanizeErrorMessage).filter(Boolean) : [];
  summary.className = "detail-summary";
  summary.innerHTML = `
    <div class="summary-stack">
      ${renderMetricCards([
        { label: t("register.name.label"), value: payload.name },
        { label: t("generic.version"), value: payload.version },
        { label: t("generic.variant"), value: payload.variant },
        { label: t("models.runtime_mode"), value: payload.mode },
      ])}
      <div class="detail-columns">
        <section class="detail-block">
          <h4>${escapeHtml(t("models.cache"))}</h4>
          <div class="info-rows">
            ${renderInfoRows([
              { label: t("models.local_dir"), value: payload.local_dir, mono: true },
              { label: t("models.config_path"), value: payload.config_path, mono: true },
              { label: t("models.checkpoint"), value: payload.checkpoint_path || t("models.checkpoint.missing"), mono: true },
            ])}
          </div>
        </section>
        <section class="detail-block">
          <h4>${escapeHtml(t("models.runtime"))}</h4>
          <div class="info-rows">
            ${renderInfoRows([
              { label: t("runtime.chunk_size"), value: runtime.chunk_size },
              { label: t("runtime.tokens_per_chunk"), value: runtime.tokens_per_chunk },
              { label: t("runtime.codebook_size"), value: runtime.codebook_size },
              {
                label: t("models.status"),
                value: runtime.ready ? t("models.status.ready") : t("models.status.not_ready"),
              },
              {
                label: t("models.resolved_source_repo"),
                value: runtime.resolved_source_repo_path || runtime.source_repo_path || t("models.source_repo.missing"),
                mono: true,
              },
              {
                label: t("models.configured_source_repo"),
                value: runtime.configured_source_repo_path || t("models.source_repo.missing"),
                mono: true,
              },
            ])}
          </div>
          ${
            readinessIssues.length
              ? `
                <div class="path-list">
                  <div class="path-pill">${escapeHtml(t("models.ready_issues"))}</div>
                  ${readinessIssues
                    .map((issue) => `<div class="path-pill mono">${escapeHtml(issue)}</div>`)
                    .join("")}
                </div>
              `
              : ""
          }
        </section>
      </div>
    </div>
  `;
}

function renderInspect() {
  const summary = $("#inspect-summary");
  const raw = $("#inspect-json");
  raw.textContent = formatJson(state.inspectResult);
  if (!state.inspectResult) {
    summary.className = "inspect-summary empty-state-host";
    summary.innerHTML = emptyState("▣", t("inspect.empty.title"), t("inspect.empty.desc"));
    return;
  }

  const manifest = state.inspectResult;
  const model = manifest.model || {};
  const chunking = manifest.chunking || {};
  const counts = manifest.counts || {};
  const paths = manifest.paths || {};
  const pathItems = [
    paths.reads,
    paths.run_infos,
    paths.end_reasons,
    ...(paths.token_shards || []),
    ...(paths.norm_stat_shards || []),
    ...(paths.valid_length_shards || []),
    ...(paths.start_shards || []),
  ].filter(Boolean);

  summary.className = "inspect-summary";
  summary.innerHTML = `
    <div class="summary-stack">
      ${renderMetricCards(
        [
          { label: t("inspect.metric.file"), value: pathLeaf(state.inspectSourcePath, t("inspect.current_bundle")) },
          { label: t("inspect.metric.model"), value: model.model_name },
          { label: t("inspect.metric.reads"), value: counts.read_count || 0 },
          { label: t("inspect.metric.chunks"), value: counts.chunk_count || 0 },
          { label: t("inspect.metric.chunk_size"), value: chunking.chunk_size },
          { label: t("inspect.metric.hop_size"), value: chunking.hop_size },
        ],
        "metric-grid-wide"
      )}
      <div class="detail-columns">
        <section class="detail-block">
          <h4>${escapeHtml(t("inspect.model_chunking"))}</h4>
          <div class="info-rows">
            ${renderInfoRows([
              { label: t("inspect.model_version"), value: model.model_version },
              { label: t("generic.variant"), value: model.model_variant },
              { label: t("inspect.source_mode"), value: model.source_mode },
              { label: t("runtime.tokens_per_chunk"), value: chunking.tokens_per_chunk },
              { label: t("inspect.short_policy"), value: chunking.short_chunk_policy },
            ])}
          </div>
        </section>
        <section class="detail-block">
          <h4>${escapeHtml(t("inspect.packaging"))}</h4>
          <div class="info-rows">
            ${renderInfoRows([
              { label: t("inspect.bundle_format"), value: manifest.bundle_format },
              { label: t("inspect.packaging_kind"), value: manifest.packaging?.kind },
              { label: t("inspect.inner_dir"), value: manifest.packaging?.inner_bundle_dir || t("common.none"), mono: true },
            ])}
          </div>
          ${pathItems.length ? renderPathList(pathItems) : ""}
        </section>
      </div>
    </div>
  `;
}

function statusBadge(task) {
  const labelKey = TASK_STATUS_KEYS[task.status];
  const label = labelKey ? t(labelKey) : task.status || t("generic.unknown");
  return `<span class="status-badge ${escapeHtml(task.status || "unknown")}">${escapeHtml(label)}</span>`;
}

function taskKindLabel(kind) {
  return TASK_KIND_KEYS[kind] ? t(TASK_KIND_KEYS[kind]) : kind || t("generic.unknown");
}

function taskKindIcon(kind) {
  return TASK_KIND_ICONS[kind] || "任";
}

function resolveTaskOutput(task) {
  const result = task.result || {};
  return task.outputPath || result.output_path || result.output_bundle || result.output_pod5 || "";
}

function taskFileName(task) {
  return pathLeaf(task.inputPath) || pathLeaf(resolveTaskOutput(task)) || t("task.fallback_name", { kind: taskKindLabel(task.kind) });
}

function taskMetrics(task) {
  const result = task.result || {};
  const base = [
    { label: t("task.metric.status"), value: TASK_STATUS_KEYS[task.status] ? t(TASK_STATUS_KEYS[task.status]) : task.status || t("generic.unknown") },
    { label: t("task.metric.duration"), value: formatDuration(task.startedAt, task.endedAt) },
    { label: t("task.metric.reads"), value: result.read_count ?? t("common.none") },
    { label: t("task.metric.chunks"), value: result.chunk_count ?? t("common.none") },
  ];
  if (task.kind === "encode") {
    base.push(
      { label: t("task.metric.output_size"), value: formatBytes(result.packed_bundle_size_bytes) },
      { label: t("task.metric.raw_size"), value: formatBytes(result.raw_bundle_size_bytes) }
    );
  } else {
    base.push(
      { label: t("task.metric.started_at"), value: formatDateTime(task.startedAt) },
      { label: t("task.metric.ended_at"), value: formatDateTime(task.endedAt) }
    );
  }
  return base;
}

function renderTasks() {
  const list = $("#tasks-list");
  if (!state.tasks.length) {
    list.className = "card-list empty-state-host";
    list.innerHTML = emptyState("☾", t("task.list.empty.title"), t("task.list.empty.desc"));
  } else {
    list.className = "card-list";
    list.innerHTML = state.tasks
      .map((task) => {
        const detailText =
          task.status === "completed"
            ? t("task.detail.completed", { kind: taskKindLabel(task.kind) })
            : task.status === "failed"
              ? t("task.detail.failed")
              : task.status === "running"
                ? t("task.detail.processing")
                : TASK_STATUS_KEYS[task.status]
                  ? t(TASK_STATUS_KEYS[task.status])
                  : t("generic.unknown");
        return `
          <div class="task-card ${task.id === state.selectedTaskId ? "selected" : ""}">
            <button type="button" class="task-card-main" data-task-action="select" data-task-id="${escapeHtml(task.id)}">
              <span class="task-kind-icon">${escapeHtml(taskKindIcon(task.kind))}</span>
              <div class="card-copy">
                <div class="card-title-row">
                  <div class="card-title">${escapeHtml(taskFileName(task))}</div>
                  ${statusBadge(task)}
                </div>
                <div class="card-meta">${escapeHtml(taskKindLabel(task.kind))} · ${escapeHtml(formatDateTime(task.createdAt))}</div>
                <div class="task-subtle">${escapeHtml(detailText)}</div>
              </div>
            </button>
            <div class="button-row compact">
              ${
                task.status === "running" || task.status === "cancelling"
                  ? `<button type="button" data-task-action="cancel" data-task-id="${escapeHtml(task.id)}" class="danger-button">${escapeHtml(t("task.action.cancel"))}</button>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");
  }

  const selected = state.tasks.find((task) => task.id === state.selectedTaskId) || null;
  const summary = $("#task-detail-summary");
  const detailJson = $("#task-detail-json");
  const detailLog = $("#task-detail-log");
  if (!selected) {
    summary.className = "task-detail empty-state-host";
    summary.innerHTML = emptyState("◐", t("task.select.empty.title"), t("task.select.empty.desc"));
    detailJson.textContent = "";
    detailLog.textContent = t("task.log.empty");
    return;
  }

  const outputPath = resolveTaskOutput(selected);
  const infoRows = [
    { label: t("task.input"), value: selected.inputPath || t("generic.none_registered"), mono: true },
    { label: t("task.output"), value: outputPath || t("generic.none_registered"), mono: true },
    { label: t("task.created_at"), value: formatDateTime(selected.createdAt) },
  ];
  const statusRows = [
    {
      label: t("task.metric.status"),
      value: TASK_STATUS_KEYS[selected.status] ? t(TASK_STATUS_KEYS[selected.status]) : selected.status || t("generic.unknown"),
    },
    { label: t("task.metric.started_at"), value: formatDateTime(selected.startedAt) },
    { label: t("task.metric.ended_at"), value: formatDateTime(selected.endedAt) },
    { label: t("task.exit_code"), value: selected.exitCode ?? t("common.none") },
    { label: t("task.error"), value: humanizeErrorMessage(selected.error) || t("generic.no_error"), mono: Boolean(selected.error) },
  ];

  summary.className = "task-detail";
  summary.innerHTML = `
    <div class="summary-stack">
      <div class="summary-heading">
        <div>
          <p class="section-kicker">${escapeHtml(t("task.current"))}</p>
          <h4>${escapeHtml(taskKindLabel(selected.kind))} · ${escapeHtml(taskFileName(selected))}</h4>
        </div>
        ${statusBadge(selected)}
      </div>
      ${renderMetricCards(taskMetrics(selected), "metric-grid-wide")}
      ${
        outputPath
          ? `
            <div class="task-actions">
              <button type="button" data-task-path-action="reveal" data-task-path="${escapeHtml(outputPath)}">${escapeHtml(t("task.reveal"))}</button>
              <button type="button" data-task-path-action="open" data-task-path="${escapeHtml(outputPath)}" class="ghost-button">${escapeHtml(t("task.open"))}</button>
            </div>
          `
          : ""
      }
      <div class="detail-columns">
        <section class="detail-block">
          <h4>${escapeHtml(t("task.core"))}</h4>
          <div class="info-rows">
            ${renderInfoRows(infoRows)}
          </div>
        </section>
        <section class="detail-block">
          <h4>${escapeHtml(t("task.extra"))}</h4>
          <div class="info-rows">
            ${renderInfoRows(statusRows)}
          </div>
        </section>
      </div>
    </div>
  `;
  detailJson.textContent = formatJson(selected.result || selected);
  detailLog.textContent = selected.logText || selected.stderr || selected.stdout || t("task.log.empty");
}

function syncTask(task) {
  const existingIndex = state.tasks.findIndex((item) => item.id === task.id);
  if (existingIndex >= 0) {
    state.tasks.splice(existingIndex, 1, task);
  } else {
    state.tasks.unshift(task);
  }
  state.tasks.sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  if (!state.selectedTaskId) {
    state.selectedTaskId = task.id;
  }
}

async function refreshSettingsAndVersions() {
  state.settings = await window.simvq.getSettings();
  renderSettingsForm();
}

async function refreshDoctor() {
  clearMessage("settings-message");
  state.doctor = await window.simvq.runDoctor();
  renderDoctor();
}

async function refreshLocalModels() {
  state.localModels = await window.simvq.models.listLocal();
  renderLocalModels();
  renderWorkflowModelSelects();
}

async function refreshRemoteModels() {
  state.remoteModels = await window.simvq.models.listRemote(currentCatalogUrl());
  renderRemoteModels();
}

async function refreshTasks() {
  state.tasks = await window.simvq.tasks.list();
  if (!state.selectedTaskId && state.tasks.length) {
    state.selectedTaskId = state.tasks[0].id;
  }
  if (state.selectedTaskId && !state.tasks.some((task) => task.id === state.selectedTaskId)) {
    state.selectedTaskId = state.tasks.length ? state.tasks[0].id : null;
  }
  renderTasks();
}

async function refreshAll() {
  await refreshSettingsAndVersions();
  const results = await Promise.allSettled([refreshDoctor(), refreshLocalModels(), refreshRemoteModels(), refreshTasks()]);
  const failed = results.find((result) => result.status === "rejected");
  if (failed && failed.reason) {
    throw failed.reason;
  }
}

async function saveSettings(event) {
  event.preventDefault();
  const payload = {
    language: $("#settings-language").value,
    pythonExecutable: $("#settings-python").value.trim(),
    repoRoot: $("#settings-repo-root").value.trim(),
    catalogUrl: $("#settings-catalog-url").value.trim(),
    modelSourceRepo: $("#settings-model-source-repo").value.trim(),
  };
  state.settings = await window.simvq.updateSettings(payload);
  renderSettingsForm();
  renderDoctor();
  renderRemoteModels();
  renderLocalModels();
  renderModelDetail();
  renderInspect();
  renderTasks();
  renderAllFilePickers();
  setMessage("settings-message", t("message.settings.saved"), "success");
}

async function choosePath(options) {
  return window.simvq.pickPath(options);
}

function isAcceptedExtension(filePath, extensions = []) {
  if (!extensions.length) {
    return true;
  }
  const lower = String(filePath || "").toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext.toLowerCase()));
}

async function handleDroppedFile(fieldId, file) {
  const config = FILE_PICKER_CONFIG[fieldId];
  const resolvedPath =
    (window.simvq.getPathForFile && typeof window.simvq.getPathForFile === "function"
      ? window.simvq.getPathForFile(file)
      : "") ||
    file.path ||
    "";
  if (!resolvedPath) {
    throw new Error(t("error.drag.read_path"));
  }
  if (!isAcceptedExtension(resolvedPath, config.extensions || [])) {
    throw new Error(t("error.drag.invalid_type"));
  }
  applySelectedPath(fieldId, resolvedPath);
}

function bindPickerCards() {
  document.querySelectorAll("[data-file-picker]").forEach((card) => {
    const fieldId = card.dataset.filePicker;
    const config = FILE_PICKER_CONFIG[fieldId];
    if (!config) {
      return;
    }

    const openBrowse = () => {
      const buttonId = card.dataset.browseButton;
      const button = buttonId ? document.getElementById(buttonId) : null;
      if (button) {
        button.click();
      }
    };

    card.addEventListener("click", (event) => {
      if (event.target instanceof HTMLElement && event.target.closest("button")) {
        return;
      }
      openBrowse();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      openBrowse();
    });

    if (!config.allowDrop) {
      return;
    }

    const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes("Files");

    const stopDrag = () => {
      card.dataset.dragging = "false";
    };

    card.addEventListener("dragenter", (event) => {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      card.dataset.dragging = "true";
    });

    card.addEventListener("dragover", (event) => {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      card.dataset.dragging = "true";
    });

    card.addEventListener("dragleave", (event) => {
      event.preventDefault();
      if (event.relatedTarget instanceof Node && card.contains(event.relatedTarget)) {
        return;
      }
      stopDrag();
    });

    card.addEventListener("drop", async (event) => {
      event.preventDefault();
      stopDrag();
      const files = Array.from(event.dataTransfer?.files || []);
      if (!files.length) {
        return;
      }
      try {
        clearMessage(config.messageId);
        await handleDroppedFile(fieldId, files[0]);
      } catch (error) {
        setMessage(config.messageId, error.message, "error");
      }
    });
  });
}

async function bindBrowseButtons() {
  $("#settings-repo-browse").addEventListener("click", async () => {
    const value = await choosePath({ kind: "openDirectory", title: t("dialog.settings.repo_root") });
    if (value) {
      $("#settings-repo-root").value = value;
    }
  });

  $("#settings-model-source-repo-browse").addEventListener("click", async () => {
    const value = await choosePath({ kind: "openDirectory", title: t("dialog.settings.model_repo") });
    if (value) {
      $("#settings-model-source-repo").value = value;
    }
  });

  $("#register-checkpoint-browse").addEventListener("click", async () => {
    const value = await choosePath({ kind: "openDirectory", title: t("dialog.register.checkpoint") });
    if (value) {
      $("#register-checkpoint").value = value;
    }
  });

  $("#register-source-repo-browse").addEventListener("click", async () => {
    const value = await choosePath({ kind: "openDirectory", title: t("dialog.register.source_repo") });
    if (value) {
      $("#register-source-repo").value = value;
    }
  });

  $("#register-config-json-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "openFile",
      title: t("dialog.register.config_json"),
      filters: [{ name: t("dialog.filter.json"), extensions: ["json"] }],
    });
    if (value) {
      $("#register-config-json").value = value;
    }
  });

  $("#encode-input-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "openFile",
      title: t("dialog.encode.input"),
      filters: [{ name: t("dialog.filter.pod5"), extensions: ["pod5"] }],
    });
    if (value) {
      applySelectedPath("encode-input", value);
    }
  });

  $("#encode-output-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "saveFile",
      title: t("dialog.encode.output"),
      defaultPath: $("#encode-output").value.trim() || guessEncodeOutput($("#encode-input").value.trim()),
      filters: [{ name: t("dialog.filter.bundle"), extensions: ["gz"] }],
    });
    if (value) {
      setFieldValue("encode-output", value);
    }
  });

  $("#decode-input-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "openFile",
      title: t("dialog.decode.input"),
      filters: [{ name: t("dialog.filter.bundle"), extensions: ["gz", "vq"] }],
    });
    if (value) {
      applySelectedPath("decode-input", value);
    }
  });

  $("#decode-output-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "saveFile",
      title: t("dialog.decode.output"),
      defaultPath: $("#decode-output").value.trim() || guessDecodeOutput($("#decode-input").value.trim()),
      filters: [{ name: t("dialog.filter.pod5"), extensions: ["pod5"] }],
    });
    if (value) {
      setFieldValue("decode-output", value);
    }
  });

  $("#inspect-input-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "openFile",
      title: t("dialog.inspect.input"),
      filters: [{ name: t("dialog.filter.bundle"), extensions: ["gz", "vq"] }],
    });
    if (value) {
      applySelectedPath("inspect-input", value);
    }
  });
}

async function handleRegisterLocal(event) {
  event.preventDefault();
  clearMessage("models-message");
  const payload = {
    name: $("#register-name").value.trim(),
    checkpoint: $("#register-checkpoint").value.trim(),
    sourceRepo: $("#register-source-repo").value.trim(),
    configJson: $("#register-config-json").value.trim(),
    version: $("#register-version").value.trim(),
    variant: $("#register-variant").value.trim(),
    overwrite: $("#register-overwrite").checked,
  };
  const result = await window.simvq.models.registerLocal(payload);
  state.selectedModelPayload = result;
  renderModelDetail();
  await refreshLocalModels();
  setMessage("models-message", t("message.models.registered"), "success");
}

async function ensureModelReadyForWorkflow(modelName) {
  const name = String(modelName || "").trim();
  if (!name) {
    throw new Error(t("message.preflight.model_missing"));
  }

  const payload = await window.simvq.models.show(name);
  const runtime = payload.runtime || {};
  state.selectedModelPayload = payload;
  renderModelDetail();

  if (runtime.ready) {
    return payload;
  }

  const firstIssue = Array.isArray(runtime.issues) ? runtime.issues.map(humanizeErrorMessage).find(Boolean) : "";
  if (firstIssue) {
    throw new Error(t("message.preflight.model_not_ready", { issue: firstIssue }));
  }
  throw new Error(t("message.preflight.missing_source_repo"));
}

async function handleEncode(event) {
  event.preventDefault();
  clearMessage("encode-message");
  await ensureModelReadyForWorkflow($("#encode-model").value.trim());
  const task = await window.simvq.tasks.startEncode({
    inputPod5: $("#encode-input").value.trim(),
    output: $("#encode-output").value.trim(),
    model: $("#encode-model").value.trim(),
    batchSize: Number($("#encode-batch-size").value),
    chunkSize: Number($("#encode-chunk-size").value),
    hopSize: Number($("#encode-hop-size").value),
    shortChunkPolicy: $("#encode-short-policy").value,
    overwrite: $("#encode-overwrite").checked,
  });
  syncTask(task);
  state.selectedTaskId = task.id;
  renderTasks();
  setMessage("encode-message", t("message.encode.started"), "success");
  activateView("tasks");
}

async function handleDecode(event) {
  event.preventDefault();
  clearMessage("decode-message");
  await ensureModelReadyForWorkflow($("#decode-model").value.trim());
  const task = await window.simvq.tasks.startDecode({
    inputBundle: $("#decode-input").value.trim(),
    output: $("#decode-output").value.trim(),
    model: $("#decode-model").value.trim(),
    batchSize: Number($("#decode-batch-size").value),
    overwrite: $("#decode-overwrite").checked,
  });
  syncTask(task);
  state.selectedTaskId = task.id;
  renderTasks();
  setMessage("decode-message", t("message.decode.started"), "success");
  activateView("tasks");
}

async function handleInspect(event) {
  event.preventDefault();
  clearMessage("inspect-message");
  state.inspectSourcePath = $("#inspect-input").value.trim();
  state.inspectResult = await window.simvq.inspectBundle(state.inspectSourcePath);
  renderInspect();
  setMessage("inspect-message", t("message.inspect.done"), "success");
}

function bindNav() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => activateView(button.dataset.viewTarget));
  });
}

function bindActions() {
  $("#settings-language").addEventListener("change", () => {
    const nextLanguage = normalizeLanguage($("#settings-language").value);
    state.settings = {
      ...(state.settings || {}),
      language: nextLanguage,
    };
    applyStaticTranslations();
    updateHeader(state.activeView);
    renderDoctor();
    renderRemoteModels();
    renderLocalModels();
    renderWorkflowModelSelects();
    renderModelDetail();
    renderInspect();
    renderTasks();
    renderAllFilePickers();
  });

  $("#settings-form").addEventListener("submit", saveSettings);
  $("#doctor-run-button").addEventListener("click", async () => {
    try {
      await refreshDoctor();
      setMessage("settings-message", t("message.settings.refreshed"), "success");
    } catch (error) {
      setMessage("settings-message", error.message, "error");
    }
  });

  $("#register-model-form").addEventListener("submit", async (event) => {
    try {
      await handleRegisterLocal(event);
    } catch (error) {
      setMessage("models-message", error.message, "error");
    }
  });

  $("#encode-form").addEventListener("submit", async (event) => {
    try {
      await handleEncode(event);
    } catch (error) {
      setMessage("encode-message", error.message, "error");
    }
  });

  $("#decode-form").addEventListener("submit", async (event) => {
    try {
      await handleDecode(event);
    } catch (error) {
      setMessage("decode-message", error.message, "error");
    }
  });

  $("#inspect-form").addEventListener("submit", async (event) => {
    try {
      await handleInspect(event);
    } catch (error) {
      setMessage("inspect-message", error.message, "error");
    }
  });

  $("#refresh-all-button").addEventListener("click", async () => {
    try {
      await refreshAll();
      setMessage("settings-message", t("message.data.refreshed"), "success");
    } catch (error) {
      setMessage("settings-message", error.message, "error");
    }
  });

  $("#models-refresh-remote").addEventListener("click", async () => {
    try {
      await refreshRemoteModels();
      setMessage("models-message", t("message.models.remote_refreshed"), "success");
    } catch (error) {
      setMessage("models-message", error.message, "error");
    }
  });

  $("#models-refresh-local").addEventListener("click", async () => {
    try {
      await refreshLocalModels();
      setMessage("models-message", t("message.models.local_refreshed"), "success");
    } catch (error) {
      setMessage("models-message", error.message, "error");
    }
  });

  $("#tasks-refresh-button").addEventListener("click", async () => {
    try {
      await refreshTasks();
    } catch (error) {
      setMessage("settings-message", error.message, "error");
    }
  });

  document.body.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const clearTrigger = target.closest("[data-picker-clear]");
    if (clearTrigger instanceof HTMLElement) {
      const fieldId = clearTrigger.dataset.pickerClear;
      if (!fieldId) {
        return;
      }
      clearFieldValue(fieldId);
      if (fieldId === "inspect-input") {
        state.inspectSourcePath = "";
        state.inspectResult = null;
        renderInspect();
      }
      return;
    }

    const modelTrigger = target.closest("[data-model-action]");
    if (modelTrigger instanceof HTMLElement) {
      const modelAction = modelTrigger.dataset.modelAction;
      const modelName = modelTrigger.dataset.modelName;
      if (!modelAction || !modelName) {
        return;
      }
      try {
        if (modelAction === "pull") {
          state.selectedModelPayload = await window.simvq.models.pull(modelName, currentCatalogUrl());
          setMessage("models-message", t("message.models.pulled", { name: modelName }), "success");
          await refreshLocalModels();
        } else if (modelAction === "show") {
          state.selectedModelPayload = await window.simvq.models.show(modelName);
        } else if (modelAction === "remove") {
          await window.simvq.models.remove(modelName);
          state.selectedModelPayload = null;
          setMessage("models-message", t("message.models.removed", { name: modelName }), "success");
          await refreshLocalModels();
        }
        renderModelDetail();
      } catch (error) {
        setMessage("models-message", error.message, "error");
      }
      return;
    }

    const taskTrigger = target.closest("[data-task-action]");
    if (taskTrigger instanceof HTMLElement) {
      const taskAction = taskTrigger.dataset.taskAction;
      const taskId = taskTrigger.dataset.taskId;
      if (!taskAction || !taskId) {
        return;
      }
      if (taskAction === "select") {
        state.selectedTaskId = taskId;
        renderTasks();
        return;
      }
      if (taskAction === "cancel") {
        await window.simvq.tasks.cancel(taskId);
        await refreshTasks();
        return;
      }
    }

    const pathTrigger = target.closest("[data-task-path-action]");
    if (pathTrigger instanceof HTMLElement) {
      const taskPathAction = pathTrigger.dataset.taskPathAction;
      const taskPath = pathTrigger.dataset.taskPath;
      if (!taskPathAction || !taskPath) {
        return;
      }
      if (taskPathAction === "reveal") {
        await window.simvq.revealPath(taskPath);
      } else if (taskPathAction === "open") {
        await window.simvq.openPath(taskPath);
      }
    }
  });
}

function subscribeTaskEvents() {
  window.simvq.onTaskEvent((payload) => {
    if (!payload || !payload.task) {
      return;
    }
    syncTask(payload.task);
    renderTasks();
  });
}

async function bootstrap() {
  applyStaticTranslations();
  bindNav();
  bindActions();
  bindPickerCards();
  await bindBrowseButtons();
  subscribeTaskEvents();
  renderWorkflowModelSelects();
  renderAllFilePickers();
  activateView("encode");
  try {
    await refreshAll();
  } catch (error) {
    setMessage("settings-message", error.message, "error");
  }
  renderModelDetail();
  renderInspect();
  renderTasks();
  renderAllFilePickers();
  applyStaticTranslations();
  updateHeader(state.activeView);
}

window.addEventListener("DOMContentLoaded", () => {
  bootstrap().catch((error) => {
    setMessage("settings-message", error.message, "error");
  });
});
