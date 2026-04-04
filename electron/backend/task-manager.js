const fs = require("fs");
const os = require("os");
const path = require("path");
const { randomUUID } = require("crypto");

const { buildEncodeArgs, buildDecodeArgs, parseJsonOutput } = require("./simvq-cli");

const MAX_LOG_CHARS = 200000;
const MAX_TASKS = 50;

function nowIso() {
  return new Date().toISOString();
}

function trimLog(text) {
  const value = String(text || "");
  if (value.length <= MAX_LOG_CHARS) {
    return value;
  }
  return value.slice(-MAX_LOG_CHARS);
}

function appendLog(current, chunk) {
  return trimLog(`${current || ""}${chunk || ""}`);
}

function safeReadJson(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (_error) {
    return null;
  }
}

function ensureSummaryRoot() {
  const dirPath = path.join(os.tmpdir(), "simvq-desktop");
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (_error) {
    return;
  }
}

function normalizePersistedTask(task) {
  const normalized = {
    ...task,
    stdout: String(task.stdout || ""),
    stderr: String(task.stderr || ""),
    logText: String(task.logText || ""),
  };
  if (normalized.status === "running" || normalized.status === "cancelling") {
    return {
      ...normalized,
      status: "interrupted",
      endedAt: normalized.endedAt || nowIso(),
      error: normalized.error || "桌面端重启，任务未继续执行。",
    };
  }
  return normalized;
}

class TaskManager {
  constructor({ backend, taskStore, onUpdate }) {
    this.backend = backend;
    this.taskStore = taskStore;
    this.onUpdate = onUpdate;
    this.running = new Map();
    this.tasks = new Map();

    const persisted = taskStore.get();
    for (const item of persisted.items || []) {
      const task = normalizePersistedTask(item);
      this.tasks.set(task.id, task);
    }
    this._persist();
  }

  _persist() {
    const items = Array.from(this.tasks.values())
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
      .slice(0, MAX_TASKS);
    this.taskStore.set({ items });
  }

  _emit(task, event) {
    if (typeof this.onUpdate === "function") {
      this.onUpdate(task, event);
    }
  }

  _upsertTask(task, event = "updated") {
    this.tasks.set(task.id, task);
    this._persist();
    this._emit(task, event);
    return task;
  }

  _patchTask(taskId, patch, event = "updated") {
    const current = this.tasks.get(taskId);
    if (!current) {
      return null;
    }
    const nextTask = {
      ...current,
      ...patch,
      updatedAt: nowIso(),
    };
    return this._upsertTask(nextTask, event);
  }

  listTasks() {
    return Array.from(this.tasks.values()).sort((left, right) =>
      String(right.createdAt).localeCompare(String(left.createdAt))
    );
  }

  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  startEncode(payload) {
    return this._startTask("encode", payload);
  }

  startDecode(payload) {
    return this._startTask("decode", payload);
  }

  cancelTask(taskId) {
    const runningTask = this.running.get(taskId);
    if (!runningTask) {
      return false;
    }
    runningTask.cancelRequested = true;
    this._patchTask(taskId, { status: "cancelling" });
    runningTask.child.kill("SIGTERM");
    setTimeout(() => {
      if (this.running.has(taskId)) {
        runningTask.child.kill("SIGKILL");
      }
    }, 3000);
    return true;
  }

  _startTask(kind, payload) {
    const id = randomUUID();
    const summaryPath = path.join(ensureSummaryRoot(), `${id}.summary.json`);
    const createdAt = nowIso();
    const args = kind === "encode" ? buildEncodeArgs(payload, summaryPath) : buildDecodeArgs(payload, summaryPath);
    const inputPath = kind === "encode" ? payload.inputPod5 : payload.inputBundle;
    const outputPath = payload.output;

    const task = {
      id,
      kind,
      status: "running",
      createdAt,
      updatedAt: createdAt,
      startedAt: createdAt,
      endedAt: null,
      params: payload,
      inputPath,
      outputPath,
      summaryPath,
      stdout: "",
      stderr: "",
      logText: "",
      result: null,
      error: null,
      exitCode: null,
      signal: null,
      commandLine: "",
    };
    this._upsertTask(task, "created");

    const spawned = this.backend.spawnCommand(args, {
      onStdout: (chunk) => {
        this._patchTask(
          id,
          {
            stdout: appendLog(this.getTask(id)?.stdout, chunk),
            logText: appendLog(this.getTask(id)?.logText, chunk),
          },
          "log"
        );
      },
      onStderr: (chunk) => {
        this._patchTask(
          id,
          {
            stderr: appendLog(this.getTask(id)?.stderr, chunk),
            logText: appendLog(this.getTask(id)?.logText, chunk),
          },
          "log"
        );
      },
    });

    this._patchTask(id, { commandLine: spawned.commandLine }, "updated");
    this.running.set(id, {
      child: spawned.child,
      summaryPath,
      cancelRequested: false,
    });

    spawned.promise
      .then((result) => {
        const running = this.running.get(id);
        this.running.delete(id);

        const summary = safeReadJson(summaryPath) || parseJsonOutput(result.stdout) || null;
        cleanupFile(summaryPath);

        const didCancel = Boolean(running && running.cancelRequested);
        const status =
          didCancel || result.signal === "SIGTERM" || result.signal === "SIGKILL"
            ? "cancelled"
            : result.code === 0
              ? "completed"
              : "failed";

        this._patchTask(
          id,
          {
            status,
            endedAt: nowIso(),
            exitCode: result.code,
            signal: result.signal,
            result: result.code === 0 ? summary : null,
            error:
              result.code === 0
                ? null
                : String(result.stderr || result.stdout || `Task exited with code ${result.code}`).trim(),
            summaryPath: null,
            stdout: trimLog(result.stdout),
            stderr: trimLog(result.stderr),
            logText: appendLog(this.getTask(id)?.logText, ""),
          },
          "finished"
        );
      })
      .catch((error) => {
        this.running.delete(id);
        cleanupFile(summaryPath);
        this._patchTask(
          id,
          {
            status: "failed",
            endedAt: nowIso(),
            error: String(error && error.message ? error.message : error),
            summaryPath: null,
          },
          "finished"
        );
      });

    return this.getTask(id);
  }
}

module.exports = {
  TaskManager,
};
