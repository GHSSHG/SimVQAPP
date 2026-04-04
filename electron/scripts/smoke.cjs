const fs = require("fs");
const os = require("os");
const path = require("path");

const { JsonStore, detectDefaultPythonExecutable } = require("../backend/store");
const { SimVQCliBackend } = require("../backend/simvq-cli");
const { TaskManager } = require("../backend/task-manager");

function waitForTask(taskManager, taskId, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const task = taskManager.getTask(taskId);
      if (!task) {
        clearInterval(timer);
        reject(new Error(`Task not found: ${taskId}`));
        return;
      }
      if (["completed", "failed", "cancelled", "interrupted"].includes(task.status)) {
        clearInterval(timer);
        resolve(task);
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`Timed out waiting for task ${taskId}`));
      }
    }, 1000);
  });
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const pythonExecutable = detectDefaultPythonExecutable();

  const backend = new SimVQCliBackend(() => ({
    repoRoot,
    pythonExecutable,
  }));

  console.log("[1/5] doctor");
  const doctor = await backend.doctor();
  console.log(JSON.stringify(doctor, null, 2));

  console.log("[2/5] local models");
  const localModels = await backend.listLocalModels();
  console.log(JSON.stringify(localModels, null, 2));

  const bundlePath = path.join(repoRoot, "outputs", "multi_fast5_zip.real.fixed.vq.tar.gz");
  const samplePod5 = path.join(repoRoot, "samples", "multi_fast5_zip.pod5");
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Smoke bundle is missing: ${bundlePath}`);
  }
  if (!fs.existsSync(samplePod5)) {
    throw new Error(`Smoke POD5 sample is missing: ${samplePod5}`);
  }

  console.log("[3/5] inspect existing bundle");
  const manifest = await backend.inspectBundle(bundlePath);
  console.log(JSON.stringify(manifest, null, 2));

  console.log("[4/5] show model");
  const modelName =
    (localModels.find((item) => item.name === "simvq-v45-3x") || localModels[0] || {}).name;
  if (!modelName) {
    throw new Error("No local model available for smoke test.");
  }
  const modelPayload = await backend.showModel(modelName);
  console.log(JSON.stringify(modelPayload, null, 2));

  console.log("[5/5] task manager encode");
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "simvq-electron-smoke-"));
  const taskStore = new JsonStore(
    path.join(tempDir, "tasks.json"),
    () => ({ items: [] }),
    (payload) => ({ items: Array.isArray(payload.items) ? payload.items : [] })
  );
  const taskManager = new TaskManager({
    backend,
    taskStore,
  });

  const smokeModelName =
    (localModels.find((item) => item.name === "simvq-v45-stub") || localModels[0] || {}).name;
  const outputBundle = path.join(tempDir, "smoke-output.vq.tar.gz");
  const task = taskManager.startEncode({
    inputPod5: samplePod5,
    output: outputBundle,
    model: smokeModelName,
    batchSize: 128,
    chunkSize: 12288,
    hopSize: 11688,
    shortChunkPolicy: "normalize_then_zero_pad",
    overwrite: true,
  });
  const finalTask = await waitForTask(taskManager, task.id, 180000);
  console.log(JSON.stringify(finalTask, null, 2));

  if (finalTask.status !== "completed") {
    throw new Error(`Encode smoke task failed: ${finalTask.error || finalTask.status}`);
  }
  if (!fs.existsSync(outputBundle)) {
    throw new Error(`Encode smoke output is missing: ${outputBundle}`);
  }
  const smokeManifest = await backend.inspectBundle(outputBundle);
  console.log(JSON.stringify(smokeManifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
