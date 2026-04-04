const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function quoteArg(value) {
  const text = String(value);
  return /\s/.test(text) ? JSON.stringify(text) : text;
}

function composePythonPath(repoRoot) {
  const sourcePath = path.join(repoRoot, "src");
  const current = process.env.PYTHONPATH;
  return current ? `${sourcePath}${path.delimiter}${current}` : sourcePath;
}

function parseJsonOutput(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return null;
  }

  const candidates = [trimmed];
  const lines = trimmed.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trimStart();
    if (line.startsWith("{") || line.startsWith("[")) {
      candidates.push(lines.slice(index).join("\n"));
    }
  }

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(candidates[index]);
    } catch (_error) {
      continue;
    }
  }
  return null;
}

function normalizeOptionalNumber(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureString(value, label) {
  const text = String(value || "").trim();
  if (!text) {
    throw new Error(`Missing required field: ${label}`);
  }
  return text;
}

function buildEncodeArgs(params, summaryPath) {
  const args = [
    "encode",
    ensureString(params.inputPod5, "inputPod5"),
    "--model",
    ensureString(params.model, "model"),
    "--output",
    ensureString(params.output, "output"),
    "--batch-size",
    String(normalizeOptionalNumber(params.batchSize, 128)),
    "--chunk-size",
    String(normalizeOptionalNumber(params.chunkSize, 12288)),
    "--hop-size",
    String(normalizeOptionalNumber(params.hopSize, 11688)),
    "--short-chunk-policy",
    ensureString(params.shortChunkPolicy || "normalize_then_zero_pad", "shortChunkPolicy"),
    "--summary-json",
    summaryPath,
  ];
  if (params.overwrite) {
    args.push("--overwrite");
  }
  return args;
}

function buildDecodeArgs(params, summaryPath) {
  const args = [
    "decode",
    ensureString(params.inputBundle, "inputBundle"),
    "--model",
    ensureString(params.model, "model"),
    "--output",
    ensureString(params.output, "output"),
    "--batch-size",
    String(normalizeOptionalNumber(params.batchSize, 128)),
    "--summary-json",
    summaryPath,
  ];
  if (params.overwrite) {
    args.push("--overwrite");
  }
  return args;
}

class SimVQCliBackend {
  constructor(getSettings) {
    this.getSettings = getSettings;
  }

  resolveSettings(overrides = {}) {
    const merged = {
      ...(this.getSettings ? this.getSettings() : {}),
      ...overrides,
    };
    const repoRoot = path.resolve(String(merged.repoRoot || ""));
    const pythonExecutable = String(merged.pythonExecutable || "python3").trim();
    if (!repoRoot || !fs.existsSync(path.join(repoRoot, "src", "simvq", "cli", "main.py"))) {
      throw new Error(`SimVQ repoRoot is invalid: ${repoRoot}`);
    }
    if (!pythonExecutable) {
      throw new Error("Python executable is empty.");
    }
    return {
      ...merged,
      repoRoot,
      pythonExecutable,
    };
  }

  spawnCommand(args, options = {}) {
    const settings = this.resolveSettings(options.settings);
    const commandArgs = ["-m", "simvq.cli.main", ...args];
    const child = spawn(settings.pythonExecutable, commandArgs, {
      cwd: options.cwd || settings.repoRoot,
      env: {
        ...process.env,
        ...options.env,
        PYTHONPATH: composePythonPath(settings.repoRoot),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (typeof options.onStdout === "function") {
        options.onStdout(text);
      }
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (typeof options.onStderr === "function") {
        options.onStderr(text);
      }
    });

    const promise = new Promise((resolve, reject) => {
      child.once("error", (error) => reject(error));
      child.once("close", (code, signal) =>
        resolve({
          code,
          signal,
          stdout,
          stderr,
          commandLine: [settings.pythonExecutable, ...commandArgs].map(quoteArg).join(" "),
        })
      );
    });

    return {
      child,
      promise,
      commandLine: [settings.pythonExecutable, ...commandArgs].map(quoteArg).join(" "),
      settings,
    };
  }

  async runJsonCommand(args, options = {}) {
    const { promise } = this.spawnCommand(args, options);
    const result = await promise;
    if (result.code !== 0) {
      const stderr = String(result.stderr || "").trim();
      const stdout = String(result.stdout || "").trim();
      throw new Error(stderr || stdout || `CLI exited with code ${result.code}`);
    }
    const parsed = parseJsonOutput(result.stdout);
    if (parsed === null) {
      throw new Error(`CLI did not emit JSON.\n${result.stdout}`);
    }
    return parsed;
  }

  doctor() {
    return this.runJsonCommand(["doctor", "--json"]);
  }

  inspectBundle(bundlePath) {
    return this.runJsonCommand(["inspect", ensureString(bundlePath, "bundle"), "--json"]);
  }

  listLocalModels() {
    return this.runJsonCommand(["model", "list-local"]);
  }

  listRemoteModels(catalogUrl) {
    const args = ["model", "list-remote"];
    if (catalogUrl) {
      args.push("--catalog-url", String(catalogUrl));
    }
    return this.runJsonCommand(args);
  }

  showModel(name) {
    return this.runJsonCommand(["model", "show", ensureString(name, "model name")]);
  }

  pullModel(name, catalogUrl) {
    const args = ["model", "pull", ensureString(name, "model name")];
    if (catalogUrl) {
      args.push("--catalog-url", String(catalogUrl));
    }
    return this.runJsonCommand(args);
  }

  registerLocalModel(payload) {
    const args = [
      "model",
      "register-local",
      ensureString(payload.name, "name"),
      "--checkpoint",
      ensureString(payload.checkpoint, "checkpoint"),
      "--source-repo",
      ensureString(payload.sourceRepo, "sourceRepo"),
      "--config-json",
      ensureString(payload.configJson, "configJson"),
      "--variant",
      ensureString(payload.variant || "v45", "variant"),
    ];
    if (payload.version) {
      args.push("--version", String(payload.version));
    }
    if (payload.overwrite) {
      args.push("--overwrite");
    }
    return this.runJsonCommand(args);
  }

  removeModel(name) {
    return this.runJsonCommand(["model", "remove", ensureString(name, "model name")]);
  }
}

module.exports = {
  SimVQCliBackend,
  buildDecodeArgs,
  buildEncodeArgs,
  parseJsonOutput,
};
