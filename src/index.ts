import { app, BrowserWindow, dialog } from "electron";
import log from "electron-log";
import { autoUpdater } from "electron-updater";

// Webpack entry points
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Configure logging for auto-updater
log.transports.file.level = "debug";
autoUpdater.logger = log;
autoUpdater.autoDownload = false;

// Reference to main window
let mainWindow: BrowserWindow | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

function setupAutoUpdater(): void {
  // Check for updates
  autoUpdater.checkForUpdates().catch((err) => {
    log.error("Error checking for updates:", err);
  });

  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    if (!mainWindow) return;

    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Update Available",
        message: `Version ${info.version} is available. Would you like to download it now?`,
        buttons: ["Yes", "No"],
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      })
      .catch((err) => {
        log.error("Error showing update dialog:", err);
      });
  });

  autoUpdater.on("update-not-available", () => {
    log.info("Update not available");
  });

  autoUpdater.on("download-progress", (progressObj) => {
    const message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`;
    log.info(message);

    if (mainWindow) {
      mainWindow.webContents.send("update-progress", {
        percent: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    if (!mainWindow) return;

    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Update Ready",
        message: `Version ${info.version} has been downloaded. Would you like to install it now?`,
        buttons: ["Yes", "Later"],
      })
      .then((result) => {
        if (result.response === 0) {
          // Quit and install update
          autoUpdater.quitAndInstall(false, true);
        }
      })
      .catch((err) => {
        log.error("Error showing install dialog:", err);
      });
  });

  autoUpdater.on("error", (err) => {
    log.error("AutoUpdater error:", err);
    if (mainWindow) {
      dialog.showErrorBox(
        "Update Error",
        "An error occurred while updating the application: " + err.message
      );
    }
  });
}

// Set up periodic update checks (every 4 hours)
function scheduleUpdateChecks(): void {
  const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.error("Error in scheduled update check:", err);
    });
  }, CHECK_INTERVAL);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();
  scheduleUpdateChecks();
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
