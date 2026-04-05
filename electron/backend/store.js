const fs = require("fs");
const path = require("path");

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function repoLooksValid(candidate) {
  if (!candidate) {
    return false;
  }
  return fs.existsSync(path.join(candidate, "src", "simvq", "__init__.py"));
}

function detectDefaultRepoRoot(appInstance) {
  const candidates = [
    process.env.SIMVQ_REPO_ROOT,
    path.resolve(__dirname, "..", ".."),
    appInstance.getAppPath(),
    process.cwd(),
  ]
    .filter(Boolean)
    .map((item) => path.resolve(item));

  return candidates.find(repoLooksValid) || path.resolve(__dirname, "..", "..");
}

function looksLikePackagedRepoRoot(candidate) {
  const resolved = path.resolve(String(candidate || ""));
  return /[/\\]dist[/\\].+[/\\](Resources|resources)[/\\]app$/.test(resolved);
}

function resolveRepoRoot(appInstance, candidate) {
  const detected = detectDefaultRepoRoot(appInstance);
  const raw = String(candidate || "").trim();
  if (!raw) {
    return detected;
  }

  const resolved = path.resolve(raw);
  if (
    appInstance &&
    appInstance.isPackaged === false &&
    repoLooksValid(detected) &&
    looksLikePackagedRepoRoot(resolved)
  ) {
    return detected;
  }
  return resolved;
}

function detectDefaultPythonExecutable() {
  const condaPython = process.env.CONDA_PREFIX
    ? path.join(process.env.CONDA_PREFIX, "bin", "python")
    : null;
  if (condaPython && fs.existsSync(condaPython)) {
    return condaPython;
  }

  const venvPython = process.env.VIRTUAL_ENV ? path.join(process.env.VIRTUAL_ENV, "bin", "python") : null;
  if (venvPython && fs.existsSync(venvPython)) {
    return venvPython;
  }

  const configured =
    process.env.SIMVQ_PYTHON ||
    process.env.PYTHON_EXECUTABLE ||
    process.env.PYTHON;
  if (configured) {
    return configured;
  }
  return "python";
}

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

function detectDefaultLanguage(appInstance) {
  const configured = process.env.SIMVQ_LANGUAGE || process.env.LANG || (appInstance && appInstance.getLocale?.());
  return normalizeLanguage(configured);
}

function normalizeSettings(appInstance, payload = {}) {
  return {
    pythonExecutable: String(payload.pythonExecutable || detectDefaultPythonExecutable()).trim(),
    repoRoot: resolveRepoRoot(appInstance, payload.repoRoot),
    catalogUrl: String(payload.catalogUrl || "").trim(),
    language: normalizeLanguage(payload.language || detectDefaultLanguage(appInstance)),
    windowBounds: payload.windowBounds || null,
  };
}

function normalizeTaskPayload(payload = {}) {
  return {
    items: Array.isArray(payload.items) ? payload.items : [],
  };
}

class JsonStore {
  constructor(filePath, makeDefault, normalize) {
    this.filePath = filePath;
    this.makeDefault = makeDefault;
    this.normalize = normalize;
    this.data = this._load();
  }

  _load() {
    const defaults = this.makeDefault();
    try {
      if (!fs.existsSync(this.filePath)) {
        this._write(defaults);
        return defaults;
      }
      const raw = fs.readFileSync(this.filePath, "utf-8");
      const parsed = raw.trim() ? JSON.parse(raw) : {};
      return this.normalize({
        ...defaults,
        ...parsed,
      });
    } catch (_error) {
      this._write(defaults);
      return defaults;
    }
  }

  _write(value) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
  }

  get() {
    return deepClone(this.data);
  }

  set(nextValue) {
    this.data = this.normalize(nextValue);
    this._write(this.data);
    return this.get();
  }

  update(mutator) {
    const nextValue = mutator(this.get());
    return this.set(nextValue);
  }
}

function createStores(appInstance) {
  const userDataPath = appInstance.getPath("userData");
  return {
    settings: new JsonStore(
      path.join(userDataPath, "settings.json"),
      () => normalizeSettings(appInstance),
      (payload) => normalizeSettings(appInstance, payload)
    ),
    tasks: new JsonStore(
      path.join(userDataPath, "tasks.json"),
      () => normalizeTaskPayload(),
      normalizeTaskPayload
    ),
  };
}

module.exports = {
  JsonStore,
  createStores,
  detectDefaultPythonExecutable,
  detectDefaultLanguage,
  detectDefaultRepoRoot,
  normalizeLanguage,
  normalizeSettings,
};
