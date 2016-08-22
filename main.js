var electron = require("electron");  // Module to control application life.
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

ipcMain.on("window", function(event, args) {
  if(args[0].toUpperCase() === "RESIZE" && mainWindow !== null) {
    mainWindow.setSize(args[1], args[2]);
  }
  else if(args[0].toUpperCase() === "CENTER" && mainWindow !== null) {
    mainWindow.center();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 1280, height: 720, autoHideMenuBar: true });

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the devtools.
  mainWindow.webContents.on("devtools-opened", function() {
    mainWindow.focus();
  });
  mainWindow.webContents.openDevTools({ mode: "detach" });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
