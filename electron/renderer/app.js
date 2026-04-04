const VIEWS = {
  home: {
    title: "主页 / Doctor",
    subtitle: "检查环境、保存 Python 与仓库路径，并查看 CLI 健康状态。",
  },
  models: {
    title: "模型",
    subtitle: "查看远程与本地模型，执行拉取、展示和本地注册。",
  },
  encode: {
    title: "压缩 Encode",
    subtitle: "选择 POD5、模型与输出路径，启动 `.vq.tar.gz` 压缩任务。",
  },
  decode: {
    title: "重建 Decode",
    subtitle: "从 bundle 恢复 POD5，并把任务结果留在历史里。",
  },
  inspect: {
    title: "Inspect",
    subtitle: "读取 bundle manifest，查看模型、分块和计数信息。",
  },
  tasks: {
    title: "任务 / 历史",
    subtitle: "查看 encode/decode 日志、summary、状态和输出路径。",
  },
};

const state = {
  settings: null,
  versions: null,
  doctor: null,
  localModels: [],
  remoteModels: [],
  selectedModelPayload: null,
  inspectResult: null,
  tasks: [],
  selectedTaskId: null,
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

function getModelNames() {
  const names = new Set();
  for (const item of state.localModels || []) {
    if (item.name) {
      names.add(item.name);
    }
  }
  for (const item of state.remoteModels || []) {
    if (item.name) {
      names.add(item.name);
    }
  }
  return Array.from(names).sort();
}

function setMessage(elementId, text, tone = "info") {
  const element = document.getElementById(elementId);
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

function updateHeader(viewName) {
  const entry = VIEWS[viewName];
  $("#view-title").textContent = entry.title;
  $("#view-subtitle").textContent = entry.subtitle;
}

function activateView(viewName) {
  document.querySelectorAll(".view").forEach((node) => node.classList.remove("active"));
  document.querySelectorAll(".nav-button").forEach((node) => node.classList.remove("active"));
  $(`#view-${viewName}`).classList.add("active");
  document.querySelector(`[data-view-target="${viewName}"]`).classList.add("active");
  updateHeader(viewName);
}

function renderSettingsSummary() {
  const summary = $("#settings-summary");
  if (!state.settings) {
    summary.textContent = "尚未加载设置。";
    return;
  }
  summary.innerHTML = `
    <div><strong>Python</strong> ${escapeHtml(state.settings.pythonExecutable)}</div>
    <div><strong>Repo</strong> ${escapeHtml(state.settings.repoRoot)}</div>
    <div><strong>Catalog</strong> ${escapeHtml(state.settings.catalogUrl || "内置默认")}</div>
  `;
}

function renderVersionsSummary() {
  const summary = $("#versions-summary");
  if (!state.versions) {
    summary.textContent = "";
    return;
  }
  summary.innerHTML = `
    <div>App ${escapeHtml(state.versions.appVersion)}</div>
    <div>Electron ${escapeHtml(state.versions.electronVersion)}</div>
    <div>Node ${escapeHtml(state.versions.nodeVersion)}</div>
  `;
}

function renderSettingsForm() {
  if (!state.settings) {
    return;
  }
  $("#settings-python").value = state.settings.pythonExecutable || "";
  $("#settings-repo-root").value = state.settings.repoRoot || "";
  $("#settings-catalog-url").value = state.settings.catalogUrl || "";
  $("#models-catalog-url").value = state.settings.catalogUrl || "";
  renderSettingsSummary();
}

function renderDoctor() {
  const summary = $("#doctor-summary");
  const raw = $("#doctor-json");
  if (!state.doctor) {
    summary.className = "doctor-summary empty";
    summary.textContent = "尚未运行。";
    raw.textContent = "";
    return;
  }
  summary.className = "doctor-summary";
  const checks = Object.entries(state.doctor.checks || {})
    .map(([name, value]) => `<li><strong>${escapeHtml(name)}</strong> ${escapeHtml(value)}</li>`)
    .join("");
  summary.innerHTML = `
    <div class="metric-grid">
      <div class="metric-card"><span>Python</span><strong>${escapeHtml(state.doctor.python)}</strong></div>
      <div class="metric-card"><span>Platform</span><strong>${escapeHtml(state.doctor.platform)}</strong></div>
      <div class="metric-card"><span>Cache Root</span><strong>${escapeHtml(state.doctor.cache_root)}</strong></div>
      <div class="metric-card"><span>本地模型数</span><strong>${escapeHtml(state.doctor.local_model_count)}</strong></div>
    </div>
    <ul class="bullet-list">${checks}</ul>
  `;
  raw.textContent = formatJson(state.doctor);
}

function renderModelDatalist() {
  const datalist = $("#all-models-list");
  datalist.innerHTML = getModelNames()
    .map((name) => `<option value="${escapeHtml(name)}"></option>`)
    .join("");
}

function renderRemoteModels() {
  const container = $("#remote-models-list");
  if (!state.remoteModels.length) {
    container.className = "card-list empty";
    container.textContent = "暂无远程模型。";
    return;
  }
  container.className = "card-list";
  container.innerHTML = state.remoteModels
    .map(
      (item) => `
        <div class="model-card">
          <div>
            <div class="card-title">${escapeHtml(item.name)}</div>
            <div class="card-meta">version=${escapeHtml(item.version)} · mode=${escapeHtml(item.mode)}</div>
            <div class="card-meta">variant=${escapeHtml(item.variant)}</div>
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
    container.className = "card-list empty";
    container.textContent = "暂无本地模型。";
    return;
  }
  container.className = "card-list";
  container.innerHTML = state.localModels
    .map(
      (item) => `
        <div class="model-card">
          <div>
            <div class="card-title">${escapeHtml(item.name)}</div>
            <div class="card-meta">version=${escapeHtml(item.version)} · mode=${escapeHtml(item.mode)}</div>
            <div class="card-meta">${escapeHtml(item.local_dir || "")}</div>
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
  $("#model-detail-json").textContent = formatJson(state.selectedModelPayload);
}

function renderInspect() {
  const summary = $("#inspect-summary");
  $("#inspect-json").textContent = formatJson(state.inspectResult);
  if (!state.inspectResult) {
    summary.className = "inspect-summary empty";
    summary.textContent = "暂无结果。";
    return;
  }
  const manifest = state.inspectResult;
  const model = manifest.model || {};
  const chunking = manifest.chunking || {};
  const counts = manifest.counts || {};
  summary.className = "inspect-summary";
  summary.innerHTML = `
    <div class="metric-grid">
      <div class="metric-card"><span>Bundle Format</span><strong>${escapeHtml(manifest.bundle_format || "—")}</strong></div>
      <div class="metric-card"><span>Model</span><strong>${escapeHtml(model.model_name || "—")}</strong></div>
      <div class="metric-card"><span>Reads</span><strong>${escapeHtml(counts.read_count || 0)}</strong></div>
      <div class="metric-card"><span>Chunks</span><strong>${escapeHtml(counts.chunk_count || 0)}</strong></div>
      <div class="metric-card"><span>Chunk Size</span><strong>${escapeHtml(chunking.chunk_size || "—")}</strong></div>
      <div class="metric-card"><span>Hop Size</span><strong>${escapeHtml(chunking.hop_size || "—")}</strong></div>
    </div>
  `;
}

function statusBadge(task) {
  return `<span class="status-badge ${escapeHtml(task.status)}">${escapeHtml(task.status)}</span>`;
}

function renderTasks() {
  const list = $("#tasks-list");
  if (!state.tasks.length) {
    list.className = "card-list empty";
    list.textContent = "暂无任务。";
  } else {
    list.className = "card-list";
    list.innerHTML = state.tasks
      .map(
        (task) => `
          <div class="task-card ${task.id === state.selectedTaskId ? "selected" : ""}" data-task-id="${escapeHtml(task.id)}">
            <div>
              <div class="card-title">${escapeHtml(task.kind)} ${statusBadge(task)}</div>
              <div class="card-meta">${escapeHtml(task.inputPath || "")}</div>
              <div class="card-meta">创建于 ${escapeHtml(formatDateTime(task.createdAt))}</div>
            </div>
            <div class="button-row compact">
              <button type="button" data-task-action="select" data-task-id="${escapeHtml(task.id)}">查看</button>
              ${
                task.status === "running" || task.status === "cancelling"
                  ? `<button type="button" data-task-action="cancel" data-task-id="${escapeHtml(task.id)}" class="danger-button">取消</button>`
                  : ""
              }
            </div>
          </div>
        `
      )
      .join("");
  }

  const selected = state.tasks.find((task) => task.id === state.selectedTaskId) || null;
  const summary = $("#task-detail-summary");
  const detailJson = $("#task-detail-json");
  const detailLog = $("#task-detail-log");
  if (!selected) {
    summary.className = "task-detail empty";
    summary.textContent = "选择左侧任务查看详情。";
    detailJson.textContent = "";
    detailLog.textContent = "";
    return;
  }

  summary.className = "task-detail";
  const result = selected.result || {};
  const outputPath = selected.outputPath || result.output_path || result.output_bundle || result.output_pod5 || "";
  summary.innerHTML = `
    <div class="metric-grid">
      <div class="metric-card"><span>类型</span><strong>${escapeHtml(selected.kind)}</strong></div>
      <div class="metric-card"><span>状态</span><strong>${escapeHtml(selected.status)}</strong></div>
      <div class="metric-card"><span>开始时间</span><strong>${escapeHtml(formatDateTime(selected.startedAt))}</strong></div>
      <div class="metric-card"><span>结束时间</span><strong>${escapeHtml(formatDateTime(selected.endedAt))}</strong></div>
    </div>
    <div class="task-actions">
      ${
        outputPath
          ? `<button type="button" data-task-path-action="reveal" data-task-path="${escapeHtml(outputPath)}">定位输出</button>`
          : ""
      }
      ${
        outputPath
          ? `<button type="button" data-task-path-action="open" data-task-path="${escapeHtml(outputPath)}" class="ghost-button">打开输出</button>`
          : ""
      }
    </div>
    <div class="task-inline-meta"><strong>命令</strong> ${escapeHtml(selected.commandLine || "—")}</div>
    <div class="task-inline-meta"><strong>错误</strong> ${escapeHtml(selected.error || "—")}</div>
  `;
  detailJson.textContent = formatJson(selected.result || selected);
  detailLog.textContent = selected.logText || selected.stderr || selected.stdout || "";
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
  state.versions = await window.simvq.getVersions();
  renderSettingsForm();
  renderVersionsSummary();
}

async function refreshDoctor() {
  clearMessage("settings-message");
  state.doctor = await window.simvq.runDoctor();
  renderDoctor();
}

async function refreshLocalModels() {
  state.localModels = await window.simvq.models.listLocal();
  renderLocalModels();
  renderModelDatalist();
}

async function refreshRemoteModels() {
  state.remoteModels = await window.simvq.models.listRemote(currentCatalogUrl());
  renderRemoteModels();
  renderModelDatalist();
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
  await Promise.all([refreshDoctor(), refreshLocalModels(), refreshRemoteModels(), refreshTasks()]);
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
  setMessage("settings-message", "设置已保存。", "success");
}

async function choosePath(options) {
  return window.simvq.pickPath(options);
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
      $("#encode-input").value = value;
      if (!$("#encode-output").value.trim()) {
        $("#encode-output").value = guessEncodeOutput(value);
      }
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
      $("#encode-output").value = value;
    }
  });

  $("#decode-input-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "openFile",
      title: "选择 Bundle",
      filters: [{ name: "SimVQ Bundle", extensions: ["gz", "vq"] }],
    });
    if (value) {
      $("#decode-input").value = value;
      if (!$("#decode-output").value.trim()) {
        $("#decode-output").value = guessDecodeOutput(value);
      }
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
      $("#decode-output").value = value;
    }
  });

  $("#inspect-input-browse").addEventListener("click", async () => {
    const value = await choosePath({
      kind: "openFile",
      title: "选择 Bundle",
      filters: [{ name: "SimVQ Bundle", extensions: ["gz", "vq"] }],
    });
    if (value) {
      $("#inspect-input").value = value;
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
  setMessage("encode-message", "Encode 任务已启动。", "success");
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
  setMessage("decode-message", "Decode 任务已启动。", "success");
  activateView("tasks");
}

async function handleInspect(event) {
  event.preventDefault();
  clearMessage("inspect-message");
  state.inspectResult = await window.simvq.inspectBundle($("#inspect-input").value.trim());
  renderInspect();
  setMessage("inspect-message", "Inspect 完成。", "success");
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
      setMessage("settings-message", "Doctor 已刷新。", "success");
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
  $("#tasks-refresh-button").addEventListener("click", refreshTasks);

  document.body.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const modelAction = target.dataset.modelAction;
    const modelName = target.dataset.modelName;
    if (modelAction && modelName) {
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

    const taskAction = target.dataset.taskAction;
    const taskId = target.dataset.taskId;
    if (taskAction && taskId) {
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

    const taskPathAction = target.dataset.taskPathAction;
    const taskPath = target.dataset.taskPath;
    if (taskPathAction && taskPath) {
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
  await bindBrowseButtons();
  subscribeTaskEvents();
  await refreshAll();
}

window.addEventListener("DOMContentLoaded", () => {
  bootstrap().catch((error) => {
    setMessage("settings-message", error.message, "error");
  });
});
