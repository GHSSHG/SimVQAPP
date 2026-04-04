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

function normalizeSettings(appInstance, payload = {}) {
  return {
    pythonExecutable: String(payload.pythonExecutable || detectDefaultPythonExecutable()).trim(),
    repoRoot: path.resolve(String(payload.repoRoot || detectDefaultRepoRoot(appInstance)).trim()),
    catalogUrl: String(payload.catalogUrl || "").trim(),
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
  detectDefaultRepoRoot,
  normalizeSettings,
};
