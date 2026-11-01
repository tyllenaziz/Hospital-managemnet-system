const { app, BrowserWindow, dialog, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const url = require("url");

let bridgeProcess;
let mainWindow;

// CRITICAL: Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  // Prevent multiple windows
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    icon: path.join(__dirname, "assests/logo.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
      // CRITICAL: Disable opening new windows
      nativeWindowOpen: false,
    },
  });

  const isDev = process.argv.includes("--dev");

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "frontend/dist/index.html");
    
    mainWindow.loadURL(
      url.format({
        pathname: indexPath,
        protocol: "file:",
        slashes: true,
      })
    );
  }

  // CRITICAL FIX 1: Block ALL new window attempts
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('Blocked window.open attempt:', url);
    
    // Open external URLs in default browser
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    
    // ALWAYS deny new windows
    return { action: 'deny' };
  });

  // CRITICAL FIX 2: Block external navigation
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Allow file protocol (for initial load and hash changes)
    if (parsedUrl.protocol === 'file:') {
      return;
    }
    
    // Allow localhost in dev mode only
    if (isDev && parsedUrl.hostname === 'localhost') {
      return;
    }
    
    // Block everything else
    console.log('Blocked navigation attempt:', navigationUrl);
    event.preventDefault();
    
    // Open external links in browser
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      shell.openExternal(navigationUrl);
    }
  });

  // CRITICAL FIX 3: Block new window creation
  mainWindow.webContents.on('new-window', (event, url) => {
    console.log('Blocked new-window event:', url);
    event.preventDefault();
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
  });

  // CRITICAL FIX 4: Block did-create-window
  app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      console.log('Blocked web-contents-created window:', url);
      return { action: 'deny' };
    });
  });

  // Handle loading errors
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorDescription);
    if (!isDev) {
      dialog.showErrorBox(
        "Loading Error",
        `Failed to load application:\n${errorDescription}\n\nPath: ${path.join(__dirname, "frontend/dist/index.html")}`
      );
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startLocalBridge() {
  // Better dev detection: check if running from node_modules or if --dev flag is present
  const isDev = process.argv.includes("--dev") || 
                process.defaultApp || 
                /node_modules[\\/]electron[\\/]/.test(process.execPath);
  
  let bridgePath;
  let spawnOptions;

  if (isDev) {
    // Development mode: Use the .exe directly from project root
    // __dirname is where main.js is located (project root)
    bridgePath = path.join(__dirname, "localbridge.exe");
    console.log("Starting LocalBridge (DEV) from:", bridgePath);
    console.log("Current __dirname:", __dirname);
    
    spawnOptions = {
      cwd: __dirname,
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "development" },
    };
    
    bridgeProcess = spawn(bridgePath, [], spawnOptions);
  } else {
    // Production mode: Use packaged executable from resources
    // In production, __dirname will be inside app.asar, so use process.resourcesPath
    bridgePath = path.join(process.resourcesPath, 'localbridge.exe');
    console.log("Starting LocalBridge (PROD) from:", bridgePath);
    
    spawnOptions = {
      cwd: process.resourcesPath,
      detached: true,
      stdio: 'ignore', // Hide terminal
    };
    
    bridgeProcess = spawn(bridgePath, [], spawnOptions);
    bridgeProcess.unref(); // Let Electron exit independently
  }

  bridgeProcess.on("error", (err) => {
    console.error("LocalBridge error:", err);
    dialog.showErrorBox("LocalBridge Error", `Failed to start LocalBridge:\n${err}`);
  });

  bridgeProcess.on("exit", (code) => {
    console.log(`LocalBridge exited with code ${code}`);
    if (code !== 0 && code !== null) {
      dialog.showErrorBox(
        "LocalBridge Stopped",
        `LocalBridge server stopped unexpectedly with code ${code}`
      );
    }
  });
}

app.whenReady().then(() => {
  startLocalBridge();
  
  setTimeout(() => {
    createWindow();
  }, 1000);

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (bridgeProcess) {
    console.log("Stopping LocalBridge...");
    bridgeProcess.kill();
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  dialog.showErrorBox("Application Error", `An error occurred:\n${error.message}`);
});