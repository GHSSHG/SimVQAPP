const path = require("path");
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require("electron");

const { createStores, normalizeSettings } = require("./backend/store");
const { SimVQCliBackend } = require("./backend/simvq-cli");
const { TaskManager } = require("./backend/task-manager");

let mainWindow = null;
let stores = null;
let backend = null;
let taskManager = null;

function broadcastTaskEvent(payload) {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send("simvq:task-event", payload);
    }
  }
}

function getMainWindowBounds() {
  const settings = stores.settings.get();
  return settings.windowBounds || {
    width: 1360,
    height: 920,
  };
}

function createMainWindow() {
  const bounds = getMainWindowBounds();
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 1180,
    minHeight: 760,
    show: false,
    title: "SimVQ Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("close", () => {
    if (!mainWindow) {
      return;
    }
    stores.settings.update((current) => ({
      ...current,
      windowBounds: mainWindow.getBounds(),
    }));
  });
}

function getWindowFromEvent(event) {
  return BrowserWindow.fromWebContents(event.sender) || mainWindow;
}

async function pickPath(event, options = {}) {
  const browserWindow = getWindowFromEvent(event);
  const kind = String(options.kind || "openFile");
  if (kind === "saveFile") {
    const result = await dialog.showSaveDialog(browserWindow, {
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.filters,
    });
    return result.canceled ? null : result.filePath || null;
  }

  const properties = [];
  if (kind === "openDirectory") {
    properties.push("openDirectory");
  } else {
    properties.push("openFile");
  }
  if (options.multiSelections) {
    properties.push("multiSelections");
  }

  const result = await dialog.showOpenDialog(browserWindow, {
    title: options.title,
    defaultPath: options.defaultPath,
    filters: options.filters,
    properties,
  });
  if (result.canceled) {
    return null;
  }
  return options.multiSelections ? result.filePaths : result.filePaths[0] || null;
}

function registerIpcHandlers() {
  ipcMain.handle("simvq:app:versions", () => ({
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    userDataPath: app.getPath("userData"),
  }));

  ipcMain.handle("simvq:settings:get", () => stores.settings.get());
  ipcMain.handle("simvq:settings:update", (_event, patch = {}) => {
    const updated = stores.settings.update((current) =>
      normalizeSettings(app, {
        ...current,
        ...patch,
      })
    );
    return updated;
  });

  ipcMain.handle("simvq:dialog:pick", pickPath);
  ipcMain.handle("simvq:path:open", async (_event, targetPath) => shell.openPath(String(targetPath || "")));
  ipcMain.handle("simvq:path:reveal", async (_event, targetPath) => {
    shell.showItemInFolder(String(targetPath || ""));
    return true;
  });

  ipcMain.handle("simvq:doctor:run", () => backend.doctor());
  ipcMain.handle("simvq:bundle:inspect", (_event, bundlePath) => backend.inspectBundle(bundlePath));

  ipcMain.handle("simvq:model:list-local", () => backend.listLocalModels());
  ipcMain.handle("simvq:model:list-remote", (_event, payload = {}) =>
    backend.listRemoteModels(payload.catalogUrl)
  );
  ipcMain.handle("simvq:model:show", (_event, name) => backend.showModel(name));
  ipcMain.handle("simvq:model:pull", (_event, payload = {}) =>
    backend.pullModel(payload.name, payload.catalogUrl)
  );
  ipcMain.handle("simvq:model:register-local", (_event, payload = {}) => backend.registerLocalModel(payload));
  ipcMain.handle("simvq:model:remove", (_event, name) => backend.removeModel(name));

  ipcMain.handle("simvq:task:list", () => taskManager.listTasks());
  ipcMain.handle("simvq:task:start-encode", (_event, payload = {}) => taskManager.startEncode(payload));
  ipcMain.handle("simvq:task:start-decode", (_event, payload = {}) => taskManager.startDecode(payload));
  ipcMain.handle("simvq:task:cancel", (_event, taskId) => taskManager.cancelTask(taskId));
}

async function bootstrap() {
  Menu.setApplicationMenu(null);
  stores = createStores(app);
  backend = new SimVQCliBackend(() => stores.settings.get());
  taskManager = new TaskManager({
    backend,
    taskStore: stores.tasks,
    onUpdate(task, event) {
      broadcastTaskEvent({ event, task });
    },
  });
  registerIpcHandlers();
  createMainWindow();
}

app.whenReady().then(bootstrap);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
