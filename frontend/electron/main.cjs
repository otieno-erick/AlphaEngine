const { app, BrowserWindow, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn, exec } = require('child_process');

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

function killPython() {
  if (pythonProcess && pythonProcess.pid) {
    if (process.platform === 'win32') {
      // Force kill the entire process tree on Windows (fixes the .exe lock)
      exec(`taskkill /pid ${pythonProcess.pid} /T /F`);
    } else {
      pythonProcess.kill('SIGKILL');
    }
  }
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

  // Force links to open in the system browser (Chrome/Edge)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
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

// --- AUTO UPDATER ---
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({ type: 'info', title: 'Update Available', message: 'Downloading in the background...' });
});
autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info', title: 'Update Ready', message: 'Update downloaded. Restart to apply.',
    buttons: ['Restart Now', 'Later']
  }).then((result) => { 
    if (result.response === 0) {
      killPython(); // Kill backend before restarting
      autoUpdater.quitAndInstall(); 
    }
  });
});

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();
  if (app.isPackaged) {
    setTimeout(() => { autoUpdater.checkForUpdatesAndNotify().catch(err => console.log(err)); }, 5000);
  }
});

// Ensure the backend dies with the app
app.on('before-quit', killPython);
app.on('window-all-closed', () => {
  killPython();
  if (process.platform !== 'darwin') app.quit();
});
