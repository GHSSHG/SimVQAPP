const { contextBridge, ipcRenderer } = require("electron");

function invoke(channel, payload) {
  return ipcRenderer.invoke(channel, payload);
}

contextBridge.exposeInMainWorld("simvq", {
  getVersions: () => invoke("simvq:app:versions"),
  getSettings: () => invoke("simvq:settings:get"),
  updateSettings: (patch) => invoke("simvq:settings:update", patch),
  pickPath: (options) => invoke("simvq:dialog:pick", options),
  openPath: (targetPath) => invoke("simvq:path:open", targetPath),
  revealPath: (targetPath) => invoke("simvq:path:reveal", targetPath),
  runDoctor: () => invoke("simvq:doctor:run"),
  inspectBundle: (bundlePath) => invoke("simvq:bundle:inspect", bundlePath),
  models: {
    listLocal: () => invoke("simvq:model:list-local"),
    listRemote: (catalogUrl) => invoke("simvq:model:list-remote", { catalogUrl }),
    show: (name) => invoke("simvq:model:show", name),
    pull: (name, catalogUrl) => invoke("simvq:model:pull", { name, catalogUrl }),
    registerLocal: (payload) => invoke("simvq:model:register-local", payload),
    remove: (name) => invoke("simvq:model:remove", name),
  },
  tasks: {
    list: () => invoke("simvq:task:list"),
    startEncode: (payload) => invoke("simvq:task:start-encode", payload),
    startDecode: (payload) => invoke("simvq:task:start-decode", payload),
    cancel: (taskId) => invoke("simvq:task:cancel", taskId),
  },
  onTaskEvent(callback) {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("simvq:task-event", listener);
    return () => ipcRenderer.removeListener("simvq:task-event", listener);
  },
});
