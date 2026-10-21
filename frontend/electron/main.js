const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

function startPythonBackend() {
  // This runs the backend. In production, we will point this to the compiled backend.exe
  const isDev = !app.isPackaged;
  const backendPath = isDev 
    ? path.join(__dirname, '../../venv/Scripts/python.exe') // Local dev
    : path.join(process.resourcesPath, 'backend/backend.exe'); // Production (.exe)

  if (isDev) {
    pythonProcess = spawn('python', [path.join(__dirname, '../../main.py')]);
  } else {
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

  // Wait a few seconds for Python to start, then load UI
  setTimeout(() => {
    const isDev = !app.isPackaged;
    if (isDev) {
      mainWindow.loadURL('http://localhost:5173');
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  }, 3000); 
}

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (pythonProcess) pythonProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
