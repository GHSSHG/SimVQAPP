const VIEWS = {
  encode: {
    title: "压缩 Encode",
    subtitle: "拖入源文件、选择模型，然后开始后台压缩任务。",
  },
  decode: {
    title: "重建 Decode",
    subtitle: "选择 bundle 与对应模型，把结果重建为可用的 POD5 文件。",
  },
  tasks: {
    title: "任务历史",
    subtitle: "查看最近任务的状态、耗时、输出结果与运行日志。",
  },
  inspect: {
    title: "文件探查",
    subtitle: "读取 bundle 的核心字段，快速判断模型、分块与内容概况。",
  },
  models: {
    title: "模型管理",
    subtitle: "查看可拉取模型、维护本地模型，并为工作流提供下拉选项。",
  },
  home: {
    title: "环境与系统设置",
    subtitle: "配置环境路径、模型目录地址，并查看当前系统依赖是否齐备。",
  },
};

const TASK_STATUS_LABELS = {
  running: "进行中",
  cancelling: "取消中",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
  interrupted: "已中断",
};

const TASK_KIND_LABELS = {
  encode: "压缩",
  decode: "重建",
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

const DOCTOR_FIX_HINTS = {
  numpy: "请确认当前 Python 环境已经安装 `numpy`。",
  pod5: "请确认当前 Python 环境已经安装 `pod5` 相关依赖。",
  jax: "如果需要真实推理，请安装 `jax` 及其对应平台依赖。",
  flax: "如果需要真实推理，请补齐 `flax` 依赖后重新检查。",
  "orbax.checkpoint": "如需加载 Orbax checkpoint，请安装 `orbax-checkpoint`。",
};

const FILE_PICKER_CONFIG = {
  "encode-input": {
    icon: "压",
    kicker: "输入文件",
    emptyTitle: "点击选择文件，或将 .pod5 文件拖拽至此",
    emptyDescription: "选中文件后仅展示文件名，完整路径会在悬停时显示。",
    filledDescription: "POD5 输入文件",
    allowDrop: true,
    extensions: [".pod5"],
    messageId: "encode-message",
  },
  "encode-output": {
    icon: "出",
    kicker: "输出位置",
    emptyTitle: "选择压缩结果的保存位置",
    emptyDescription: "默认会根据输入文件自动生成 .vq.tar.gz 文件名。",
    filledDescription: "输出 Bundle",
    allowDrop: false,
  },
  "decode-input": {
    icon: "建",
    kicker: "输入文件",
    emptyTitle: "点击选择文件，或将 bundle 拖拽至此",
    emptyDescription: "支持 .vq.tar.gz 或 .vq 文件，完整路径仅在悬停时显示。",
    filledDescription: "Bundle 输入文件",
    allowDrop: true,
    extensions: [".vq.tar.gz", ".tar.gz", ".vq", ".gz"],
    messageId: "decode-message",
  },
  "decode-output": {
    icon: "出",
    kicker: "输出位置",
    emptyTitle: "选择重建结果的保存位置",
    emptyDescription: "默认会根据输入 bundle 自动生成 .reconstructed.pod5 文件名。",
    filledDescription: "输出 POD5",
    allowDrop: false,
  },
  "inspect-input": {
    icon: "查",
    kicker: "待探查文件",
    emptyTitle: "点击选择文件，或将 bundle 拖拽至此",
    emptyDescription: "读取完成后只展示关键字段，完整路径仅在悬停时显示。",
    filledDescription: "待探查 Bundle",
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

function displayValue(value, fallback = "—") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
}

function formatBytes(bytes) {
  if (!Number.isFinite(Number(bytes))) {
    return "—";
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
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

function formatDuration(startValue, endValue) {
  if (!startValue) {
    return "—";
  }
  const start = new Date(startValue).getTime();
  const end = endValue ? new Date(endValue).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "—";
  }
  const totalSeconds = Math.max(0, Math.round((end - start) / 1000));
  if (totalSeconds < 1) {
    return "少于 1 秒";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) {
    return `${hours} 小时 ${minutes} 分`;
  }
  if (minutes) {
    return `${minutes} 分 ${seconds} 秒`;
  }
  return `${seconds} 秒`;
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
  const entry = VIEWS[viewName];
  if (!entry) {
    return;
  }
  $("#view-title").textContent = entry.title;
  $("#view-subtitle").textContent = entry.subtitle;
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
  element.textContent = text || "";
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
    const placeholder = options.length ? "请选择本地模型" : "暂无本地模型，请先去“模型管理”页准备模型";
    select.innerHTML = [
      `<option value="">${escapeHtml(placeholder)}</option>`,
      ...options.map((name) => {
        const suffix = current && name === current && !names.includes(name) ? "（当前值未在本地找到）" : "";
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
    kicker.textContent = config.kicker;
  }
  if (title) {
    title.textContent = hasValue ? pathLeaf(value) : config.emptyTitle;
  }
  if (description) {
    description.textContent = hasValue ? config.filledDescription : config.emptyDescription;
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
    return `${doctorCheckLabel(name)} 已就绪，可直接用于相关任务。`;
  }
  const reason = normalizeCheckMessage(value) || "当前环境未找到对应依赖。";
  const hint = DOCTOR_FIX_HINTS[name] || "请检查当前 Python 环境后重新运行自检。";
  return `${reason}。${hint}`;
}

function renderSettingsForm() {
  if (!state.settings) {
    return;
  }
  $("#settings-python").value = state.settings.pythonExecutable || "";
  $("#settings-repo-root").value = state.settings.repoRoot || "";
  $("#settings-catalog-url").value = state.settings.catalogUrl || "";
  $("#models-catalog-url").value = state.settings.catalogUrl || "";
}

function renderDoctor() {
  const summary = $("#doctor-summary");
  const raw = $("#doctor-json");
  raw.textContent = formatJson(state.doctor);
  if (!state.doctor) {
    summary.className = "doctor-summary empty-state-host";
    summary.innerHTML = emptyState("◌", "尚未运行自检", "保存环境设置后点击“重新检查环境”，即可查看当前系统状态。");
    return;
  }

  const checkRows = Object.entries(state.doctor.checks || {})
    .map(([name, value]) => {
      const ok = String(value).trim().toLowerCase() === "ok";
      return `
        <div class="health-row ${ok ? "ok" : "error"}">
          <span class="health-icon">${ok ? "✓" : "!"}</span>
          <div class="health-copy">
            <strong>${escapeHtml(doctorCheckLabel(name))} ${ok ? "（就绪）" : "（未就绪）"}</strong>
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
        { label: "Python", value: state.doctor.python },
        { label: "平台", value: state.doctor.platform },
        { label: "缓存目录", value: state.doctor.cache_root },
        { label: "本地模型数", value: state.doctor.local_model_count },
      ])}
      <section class="detail-block">
        <h4>依赖检查</h4>
        <div class="health-list">${checkRows}</div>
      </section>
    </div>
  `;
}

function renderRemoteModels() {
  const container = $("#remote-models-list");
  if (!state.remoteModels.length) {
    container.className = "card-list empty-state-host";
    container.innerHTML = emptyState("⌁", "暂无远程模型", "刷新 catalog，或者检查系统设置中的远程模型目录地址。");
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
              <div class="card-meta">版本 ${escapeHtml(displayValue(item.version, "未标注"))}</div>
            </div>
          </div>
          <div class="button-row compact">
            <button type="button" data-model-action="pull" data-model-name="${escapeHtml(item.name)}">拉取</button>
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
    container.innerHTML = emptyState("◍", "暂无本地模型", "先从上方拉取模型，或在页面底部展开表单注册已有 checkpoint。");
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
              <div class="card-meta">${escapeHtml(displayValue(item.variant, "未标注 Variant"))}</div>
              <div class="card-path mono">${escapeHtml(displayValue(item.local_dir))}</div>
            </div>
          </div>
          <div class="button-row compact">
            <button type="button" data-model-action="show" data-model-name="${escapeHtml(item.name)}">详情</button>
            <button type="button" data-model-action="remove" data-model-name="${escapeHtml(item.name)}" class="danger-button">删除</button>
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
    summary.innerHTML = emptyState("◇", "尚未选中模型", "点击本地模型的“详情”，这里会显示版本、运行模式和路径信息。");
    return;
  }

  const payload = state.selectedModelPayload;
  const runtime = payload.runtime || {};
  summary.className = "detail-summary";
  summary.innerHTML = `
    <div class="summary-stack">
      ${renderMetricCards([
        { label: "模型名", value: payload.name },
        { label: "版本", value: payload.version },
        { label: "Variant", value: payload.variant },
        { label: "运行模式", value: payload.mode },
      ])}
      <div class="detail-columns">
        <section class="detail-block">
          <h4>本地缓存</h4>
          <div class="info-rows">
            ${renderInfoRows([
              { label: "本地目录", value: payload.local_dir, mono: true },
              { label: "配置文件", value: payload.config_path, mono: true },
              { label: "Checkpoint", value: payload.checkpoint_path || "未登记", mono: true },
            ])}
          </div>
        </section>
        <section class="detail-block">
          <h4>运行参数</h4>
          <div class="info-rows">
            ${renderInfoRows([
              { label: "chunk_size", value: runtime.chunk_size },
              { label: "tokens_per_chunk", value: runtime.tokens_per_chunk },
              { label: "codebook_size", value: runtime.codebook_size },
              { label: "源仓库", value: runtime.source_repo_path || "内置或未提供", mono: true },
            ])}
          </div>
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
    summary.innerHTML = emptyState("▣", "暂无探查结果", "选择一个 bundle 并开始探查，这里会显示结构化摘要。");
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
          { label: "文件", value: pathLeaf(state.inspectSourcePath, "当前 Bundle") },
          { label: "模型", value: model.model_name },
          { label: "Reads", value: counts.read_count || 0 },
          { label: "Chunks", value: counts.chunk_count || 0 },
          { label: "Chunk Size", value: chunking.chunk_size },
          { label: "Hop Size", value: chunking.hop_size },
        ],
        "metric-grid-wide"
      )}
      <div class="detail-columns">
        <section class="detail-block">
          <h4>模型与分块</h4>
          <div class="info-rows">
            ${renderInfoRows([
              { label: "模型版本", value: model.model_version },
              { label: "Variant", value: model.model_variant },
              { label: "来源模式", value: model.source_mode },
              { label: "tokens_per_chunk", value: chunking.tokens_per_chunk },
              { label: "短块策略", value: chunking.short_chunk_policy },
            ])}
          </div>
        </section>
        <section class="detail-block">
          <h4>打包内容</h4>
          <div class="info-rows">
            ${renderInfoRows([
              { label: "Bundle 格式", value: manifest.bundle_format },
              { label: "打包方式", value: manifest.packaging?.kind },
              { label: "内部目录", value: manifest.packaging?.inner_bundle_dir || "—", mono: true },
            ])}
          </div>
          ${pathItems.length ? renderPathList(pathItems) : ""}
        </section>
      </div>
    </div>
  `;
}

function statusBadge(task) {
  const label = TASK_STATUS_LABELS[task.status] || task.status || "未知";
  return `<span class="status-badge ${escapeHtml(task.status || "unknown")}">${escapeHtml(label)}</span>`;
}

function taskKindLabel(kind) {
  return TASK_KIND_LABELS[kind] || kind || "任务";
}

function taskKindIcon(kind) {
  return TASK_KIND_ICONS[kind] || "任";
}

function resolveTaskOutput(task) {
  const result = task.result || {};
  return task.outputPath || result.output_path || result.output_bundle || result.output_pod5 || "";
}

function taskFileName(task) {
  return pathLeaf(task.inputPath) || pathLeaf(resolveTaskOutput(task)) || `${taskKindLabel(task.kind)}任务`;
}

function taskMetrics(task) {
  const result = task.result || {};
  const base = [
    { label: "状态", value: TASK_STATUS_LABELS[task.status] || task.status || "未知" },
    { label: "耗时", value: formatDuration(task.startedAt, task.endedAt) },
    { label: "Reads", value: result.read_count ?? "—" },
    { label: "Chunks", value: result.chunk_count ?? "—" },
  ];
  if (task.kind === "encode") {
    base.push(
      { label: "输出体积", value: formatBytes(result.packed_bundle_size_bytes) },
      { label: "原始体积", value: formatBytes(result.raw_bundle_size_bytes) }
    );
  } else {
    base.push(
      { label: "开始时间", value: formatDateTime(task.startedAt) },
      { label: "结束时间", value: formatDateTime(task.endedAt) }
    );
  }
  return base;
}

function renderTasks() {
  const list = $("#tasks-list");
  if (!state.tasks.length) {
    list.className = "card-list empty-state-host";
    list.innerHTML = emptyState("☾", "暂无任务", "启动压缩或重建后，任务结果和日志都会出现在这里。");
  } else {
    list.className = "card-list";
    list.innerHTML = state.tasks
      .map((task) => {
        const detailText =
          task.status === "completed"
            ? `${taskKindLabel(task.kind)}已完成`
            : task.status === "failed"
              ? "任务执行失败"
              : task.status === "running"
                ? "后台正在处理"
                : TASK_STATUS_LABELS[task.status] || "任务状态待确认";
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
                  ? `<button type="button" data-task-action="cancel" data-task-id="${escapeHtml(task.id)}" class="danger-button">取消</button>`
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
    summary.innerHTML = emptyState("◐", "尚未选中任务", "从左侧列表选择一个任务，查看结果摘要和运行日志。");
    detailJson.textContent = "";
    detailLog.textContent = "暂无日志。";
    return;
  }

  const outputPath = resolveTaskOutput(selected);
  const infoRows = [
    { label: "输入文件", value: selected.inputPath || "未记录", mono: true },
    { label: "输出文件", value: outputPath || "未记录", mono: true },
    { label: "创建时间", value: formatDateTime(selected.createdAt) },
  ];
  const statusRows = [
    { label: "当前状态", value: TASK_STATUS_LABELS[selected.status] || selected.status || "未知" },
    { label: "开始时间", value: formatDateTime(selected.startedAt) },
    { label: "结束时间", value: formatDateTime(selected.endedAt) },
    { label: "退出码", value: selected.exitCode ?? "—" },
    { label: "错误信息", value: selected.error || "无", mono: Boolean(selected.error) },
  ];

  summary.className = "task-detail";
  summary.innerHTML = `
    <div class="summary-stack">
      <div class="summary-heading">
        <div>
          <p class="section-kicker">当前任务</p>
          <h4>${escapeHtml(taskKindLabel(selected.kind))} · ${escapeHtml(taskFileName(selected))}</h4>
        </div>
        ${statusBadge(selected)}
      </div>
      ${renderMetricCards(taskMetrics(selected), "metric-grid-wide")}
      ${
        outputPath
          ? `
            <div class="task-actions">
              <button type="button" data-task-path-action="reveal" data-task-path="${escapeHtml(outputPath)}">定位输出</button>
              <button type="button" data-task-path-action="open" data-task-path="${escapeHtml(outputPath)}" class="ghost-button">打开输出</button>
            </div>
          `
          : ""
      }
      <div class="detail-columns">
        <section class="detail-block">
          <h4>核心信息</h4>
          <div class="info-rows">
            ${renderInfoRows(infoRows)}
          </div>
        </section>
        <section class="detail-block">
          <h4>状态补充</h4>
          <div class="info-rows">
            ${renderInfoRows(statusRows)}
          </div>
        </section>
      </div>
    </div>
  `;
  detailJson.textContent = formatJson(selected.result || selected);
  detailLog.textContent = selected.logText || selected.stderr || selected.stdout || "暂无日志。";
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
    pythonExecutable: $("#settings-python").value.trim(),
    repoRoot: $("#settings-repo-root").value.trim(),
    catalogUrl: $("#settings-catalog-url").value.trim(),
  };
  state.settings = await window.simvq.updateSettings(payload);
  renderSettingsForm();
  setMessage("settings-message", "系统设置已保存。", "success");
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
    throw new Error("无法读取拖入文件的真实路径，请改用“选择文件”。");
  }
  if (!isAcceptedExtension(resolvedPath, config.extensions || [])) {
    throw new Error(`文件类型不符合要求，请重新选择。`);
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
    const value = await choosePath({ kind: "openDirectory", title: "选择 SimVQ 仓库根目录" });
    if (value) {
      $("#settings-repo-root").value = value;
    }
  });

  $("#register-checkpoint-browse").addEventListener("click", async () => {
    const value = await choosePath({ kind: "openDirectory", title: "选择 checkpoint 目录" });
    if (value) {
      $("#register-checkpoint").value = value;
    }
  });

  $("#register-source-repo-browse").addEventListener("click", async () => {
    const value = await choosePath({ kind: "openDirectory", title: "选择原始 SimVQGAN 仓库" });
    if (value) {
      $("#register-source-repo").value = value;
    }
  });

  $("#register-config-json-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "openFile",
      title: "选择配置 JSON",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (value) {
      $("#register-config-json").value = value;
    }
  });

  $("#encode-input-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "openFile",
      title: "选择 POD5",
      filters: [{ name: "POD5", extensions: ["pod5"] }],
    });
    if (value) {
      applySelectedPath("encode-input", value);
    }
  });

  $("#encode-output-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "saveFile",
      title: "保存输出 Bundle",
      defaultPath: $("#encode-output").value.trim() || guessEncodeOutput($("#encode-input").value.trim()),
      filters: [{ name: "SimVQ Bundle", extensions: ["gz"] }],
    });
    if (value) {
      setFieldValue("encode-output", value);
    }
  });

  $("#decode-input-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "openFile",
      title: "选择 Bundle",
      filters: [{ name: "SimVQ Bundle", extensions: ["gz", "vq"] }],
    });
    if (value) {
      applySelectedPath("decode-input", value);
    }
  });

  $("#decode-output-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "saveFile",
      title: "保存输出 POD5",
      defaultPath: $("#decode-output").value.trim() || guessDecodeOutput($("#decode-input").value.trim()),
      filters: [{ name: "POD5", extensions: ["pod5"] }],
    });
    if (value) {
      setFieldValue("decode-output", value);
    }
  });

  $("#inspect-input-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "openFile",
      title: "选择 Bundle",
      filters: [{ name: "SimVQ Bundle", extensions: ["gz", "vq"] }],
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
  setMessage("models-message", "本地模型已注册。", "success");
}

async function handleEncode(event) {
  event.preventDefault();
  clearMessage("encode-message");
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
  setMessage("encode-message", "压缩任务已启动。", "success");
  activateView("tasks");
}

async function handleDecode(event) {
  event.preventDefault();
  clearMessage("decode-message");
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
  setMessage("decode-message", "重建任务已启动。", "success");
  activateView("tasks");
}

async function handleInspect(event) {
  event.preventDefault();
  clearMessage("inspect-message");
  state.inspectSourcePath = $("#inspect-input").value.trim();
  state.inspectResult = await window.simvq.inspectBundle(state.inspectSourcePath);
  renderInspect();
  setMessage("inspect-message", "探查完成。", "success");
}

function bindNav() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => activateView(button.dataset.viewTarget));
  });
}

function bindActions() {
  $("#settings-form").addEventListener("submit", saveSettings);
  $("#doctor-run-button").addEventListener("click", async () => {
    try {
      await refreshDoctor();
      setMessage("settings-message", "系统自检已刷新。", "success");
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
      setMessage("settings-message", "数据已刷新。", "success");
    } catch (error) {
      setMessage("settings-message", error.message, "error");
    }
  });

  $("#models-refresh-remote").addEventListener("click", async () => {
    try {
      await refreshRemoteModels();
      setMessage("models-message", "远程模型已刷新。", "success");
    } catch (error) {
      setMessage("models-message", error.message, "error");
    }
  });

  $("#models-refresh-local").addEventListener("click", async () => {
    try {
      await refreshLocalModels();
      setMessage("models-message", "本地模型已刷新。", "success");
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
          setMessage("models-message", `模型 ${modelName} 已拉取。`, "success");
          await refreshLocalModels();
        } else if (modelAction === "show") {
          state.selectedModelPayload = await window.simvq.models.show(modelName);
        } else if (modelAction === "remove") {
          await window.simvq.models.remove(modelName);
          state.selectedModelPayload = null;
          setMessage("models-message", `模型 ${modelName} 已删除。`, "success");
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
}

window.addEventListener("DOMContentLoaded", () => {
  bootstrap().catch((error) => {
    setMessage("settings-message", error.message, "error");
  });
});
