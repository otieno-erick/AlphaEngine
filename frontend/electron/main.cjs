const { app, BrowserWindow, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

function startPythonBackend() {
  const isDev = !app.isPackaged;
  if (isDev) {
    pythonProcess = spawn('python', [path.join(__dirname, '../../main.py')]);
  } else {
    const backendExe = process.platform === 'win32' ? 'backend.exe' : 'backend';
    const backendPath = path.join(process.resourcesPath, 'backend', backendExe);
    pythonProcess = spawn(backendPath, [], { detached: false });
  }
  pythonProcess.stdout.on('data', (data) => console.log(`Backend: ${data}`));
  pythonProcess.stderr.on('data', (data) => console.error(`Backend Error: ${data}`));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#0b0e14',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // --- THE FIX: Force external links to open in the default browser ---
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open all http/https links in the system default browser (Chrome, Edge, Safari)
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' }; // Prevent Electron from opening a blank internal window
    }
    return { action: 'allow' };
  });

  setTimeout(() => {
    const isDev = !app.isPackaged;
    if (isDev) {
      mainWindow.loadURL('http://localhost:5173');
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  }, 3000);
}

// --- AUTO UPDATER LOGIC ---
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: 'A new version is available. Downloading in the background...',
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. The application will restart to apply it.',
    buttons: ['Restart Now', 'Later']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();

  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(err => console.log(err));
    }, 5000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (pythonProcess) pythonProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
