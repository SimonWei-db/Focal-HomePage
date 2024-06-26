const { app, BrowserWindow, dialog, session  } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

let serverProcess;
const logFilePath = path.join(app.getPath('userData'), 'focal_client.log');
let logFile;
let serverDir;
let terminalAll = false

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.whenReady().then(() => {
    dialog.showMessageBoxSync({
      type: 'warning',
      title: 'Application Already Running',
      message: 'The application is already running and cannot open multiple instances.',
      buttons: ['OK']
    });
    app.quit();
  });
} else {
  const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB
  // Function to check log file size and delete if it exceeds MAX_LOG_SIZE
  function checkLogFileSize() {
    return new Promise((resolve, reject) => {
      fs.stat(logFilePath, (err, stats) => {
        if (err) {
          if (err.code === 'ENOENT') {
            // File does not exist, no need to delete
            console.log('Log file does not exist.');
            return resolve(false);
          } else {
            console.error(`Error checking log file size: ${err.message}`);
            return reject(err);
          }
        }

        console.log(`Log file size: ${stats.size}`);
        if (stats.size > MAX_LOG_SIZE) {
          fs.unlink(logFilePath, (err) => {
            if (err) {
              console.error(`Error deleting log file: ${err.message}`);
              return reject(err);
            } else {
              console.log(`Log file ${logFilePath} deleted due to exceeding size limit`);
              return resolve(true);
            }
          });
        } else {
          return resolve(false);
        }
      });
    });
  }

  async function initLogFile() {
    try {
      const delFlag = await checkLogFileSize();
      logFile = fs.createWriteStream(logFilePath, { flags: 'a' });
      console.log('====================Log file initialized========================');
      if (delFlag) {
        logToFile('Log file was deleted due to exceeding size limit and recreated.');
      }
    } catch (error) {
      console.error(`Failed to initialize log file: ${error.message}`);
    }
  }

 

  function logToFile(message) {
    const pid = process.pid; // 获取当前进程的PID
    const logMessage = `[${new Date().toISOString()} - PID ${pid}] - ${message}\n`;
    
    if (logFile) {
      logFile.write(logMessage);
    } else {
      console.log(`Log file is not initialized: ${logMessage}`);
    }
  }
  

  function createWindow() {
    const mainWindow = new BrowserWindow({
      width: 1280,
      height: 960,
      fullscreen: false,
      fullscreenable: true,
      autoHideMenuBar: false,
      webPreferences: {
        preload: path.join(app.getAppPath(), 'preload.js'),
        contextIsolation: false,
        nodeIntegration: true,
      }
    });

    const clientBuildPath = app.isPackaged
      ? path.join(process.resourcesPath, 'client', 'build', 'index.html')
      : path.join(app.getAppPath(), 'client', 'build', 'index.html');

    mainWindow.loadFile(clientBuildPath);
    mainWindow.maximize();
  }
  function clearAppCache() {
    const ses = session.defaultSession;
    ses.clearCache().then(() => {
      console.log('Cache cleared');
      logToFile('Cache cleared');
    }).catch((err) => {
      console.error(`Error clearing cache: ${err.message}`);
      logToFile(`Error clearing cache: ${err.message}`);
    });

    ses.clearStorageData({
      storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers'],
      quotas: ['temporary', 'persistent', 'syncable']
    }).then(() => {
      console.log('Storage data cleared');
      logToFile('Storage data cleared');
    }).catch((err) => {
      console.error(`Error clearing storage data: ${err.message}`);
      logToFile(`Error clearing storage data: ${err.message}`);
    });
  }
  

  function startServer() {
    let serverPath;
    if (app.isPackaged) {
      serverPath = path.join(process.resourcesPath, 'server.exe');
      serverDir = process.resourcesPath;
    } else {
      serverPath = path.join(app.getAppPath(), 'server', 'server.exe');
      serverDir = path.join(app.getAppPath());
    }
    console.log(`Server path: ${serverPath}`);
    logToFile(`Server path: ${serverPath}`);

    const command = `"${serverPath}"`;

    logToFile(`Current Working Directory: ${serverDir}`);
    serverProcess = exec(command, {
      cwd: serverDir,
      env: { ...process.env, PORT: 8081, JWT_SECRET: 'JWT-secure-secret-key-wxclfq7991', isSA:'true' }
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      logToFile(`stdout: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      logToFile(`stderr: ${data}`);
    });

    serverProcess.on('close', (code) => {
      const message = `child process exited with code ${code}`;
      console.log(message);
      logToFile(message);
      if (code !== 0 && !terminalAll) {
        dialog.showMessageBoxSync({
          type: 'error',
          title: 'Process Error',
          message: 'The application initialization failed, possibly due to an improper shutdown from the previous session. Please restart your computer and try again.',
          buttons: ['OK']
        });
        app.quit();
      }
    });

    console.log('Server process started');
    logToFile('Server process started');
  }

  app.on('ready', async () => {
    await initLogFile();
    console.log('App is ready');
    logToFile('App is ready');
    clearAppCache();
    startServer();
    createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      console.log('All windows closed, quitting app.');
      logToFile('All windows closed, quitting app.');
      app.quit();
    }
  });

  async function terminateServerProcess() {
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32';
      terminalAll = true
      if (isWindows) {
        exec(`taskkill /pid ${serverProcess.pid} /T /F`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error killing server process: ${error.message}`);
            logToFile(`Error killing server process: ${error.message}`);
            reject(error);
          } else {
            console.log(`Server process killed: ${stdout}`);
            logToFile(`Server process killed: ${stdout}`);
            resolve();
          }
        });
      } else {
        serverProcess.on('close', resolve);
        serverProcess.kill('SIGTERM');
      }
    });
  }


  app.on('before-quit', async (event) => {
    if (serverProcess) {
      event.preventDefault();
      await terminateServerProcess();
      clearAppCache();
      app.exit();
    }
    clearAppCache();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('Activating app, creating window.');
      logToFile('Activating app, creating window.');
      createWindow();
    }
  });
}
