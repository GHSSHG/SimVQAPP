const fs = require("fs");
const os = require("os");
const path = require("path");

const defaultModel = require("../assets/default-models/simvq-v45-3x-1200000.json");

function cacheModelsRoot() {
  return path.join(os.homedir(), ".cache", "simvq", "models");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function writeJson(targetPath, payload) {
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function removeDir(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function safeReadJson(targetPath) {
  try {
    return JSON.parse(fs.readFileSync(targetPath, "utf-8"));
  } catch (_error) {
    return null;
  }
}

function looksLikeBundledCheckpoint(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) {
    return false;
  }
  const stats = fs.statSync(targetPath);
  if (!stats.isDirectory()) {
    return false;
  }
  return ["manifest.ocdbt", "_METADATA", "_CHECKPOINT_METADATA"].some((name) =>
    fs.existsSync(path.join(targetPath, name))
  );
}

function resolveBundledCheckpoint(repoRoot, spec = defaultModel) {
  return path.resolve(String(repoRoot || ""), spec.checkpointDirName);
}

function defaultModelDir(spec = defaultModel) {
  return path.join(cacheModelsRoot(), spec.name, spec.version);
}

function expectedMetadata(spec = defaultModel) {
  return {
    name: spec.name,
    version: spec.version,
    variant: spec.variant,
    mode: spec.mode,
    checkpoint_relpath: "checkpoint",
  };
}

function expectedConfig(spec = defaultModel) {
  return deepClone(spec.config);
}

function resolveLinkTarget(targetPath) {
  try {
    if (fs.lstatSync(targetPath).isSymbolicLink()) {
      return fs.realpathSync(targetPath);
    }
  } catch (_error) {
    return null;
  }
  return null;
}

function defaultModelMatches({ repoRoot, spec = defaultModel }) {
  const modelDir = defaultModelDir(spec);
  const checkpointSource = resolveBundledCheckpoint(repoRoot, spec);
  const metadataPath = path.join(modelDir, "metadata.json");
  const configPath = path.join(modelDir, "config.json");
  const checkpointLink = path.join(modelDir, "checkpoint");

  if (!looksLikeBundledCheckpoint(checkpointSource)) {
    return false;
  }

  const metadata = safeReadJson(metadataPath);
  const config = safeReadJson(configPath);
  if (!metadata || !config) {
    return false;
  }

  const expectedMeta = expectedMetadata(spec);
  const expectedCfg = expectedConfig(spec);
  const linkTarget = resolveLinkTarget(checkpointLink);
  if (!linkTarget || path.resolve(linkTarget) !== path.resolve(checkpointSource)) {
    return false;
  }

  return (
    metadata.name === expectedMeta.name &&
    metadata.version === expectedMeta.version &&
    metadata.variant === expectedMeta.variant &&
    metadata.mode === expectedMeta.mode &&
    metadata.checkpoint_relpath === expectedMeta.checkpoint_relpath &&
    JSON.stringify(config) === JSON.stringify(expectedCfg)
  );
}

function ensureBundledDefaultModel({ repoRoot, spec = defaultModel }) {
  const checkpointSource = resolveBundledCheckpoint(repoRoot, spec);
  if (!looksLikeBundledCheckpoint(checkpointSource)) {
    return { ensured: false, reason: "missing_checkpoint", checkpointSource };
  }

  if (defaultModelMatches({ repoRoot, spec })) {
    return { ensured: true, updated: false, checkpointSource, modelDir: defaultModelDir(spec) };
  }

  const modelDir = defaultModelDir(spec);
  removeDir(modelDir);
  ensureDir(modelDir);

  writeJson(path.join(modelDir, "config.json"), expectedConfig(spec));
  writeJson(path.join(modelDir, "metadata.json"), expectedMetadata(spec));

  const checkpointLink = path.join(modelDir, "checkpoint");
  const linkType = process.platform === "win32" ? "junction" : "dir";
  fs.symlinkSync(checkpointSource, checkpointLink, linkType);

  return { ensured: true, updated: true, checkpointSource, modelDir };
}

function maybeRemoveStubModel() {
  const stubRoot = path.join(cacheModelsRoot(), "simvq-v45-stub");
  if (!fs.existsSync(stubRoot)) {
    return false;
  }
  removeDir(stubRoot);
  return true;
}

module.exports = {
  cacheModelsRoot,
  defaultModel,
  defaultModelDir,
  ensureBundledDefaultModel,
  maybeRemoveStubModel,
  resolveBundledCheckpoint,
};
