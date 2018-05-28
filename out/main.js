// Read CLI parameters
var args = process.argv.slice(2);
var cliOptions = {
    debug: false
};
for(var a = 0;a < args.length;a++) {
    var arg = args[a];
    if(arg === "--debug") cliOptions.debug = true;
}


// var electron      = require("electron");  // Module to control application life.
let { app, BrowserWindow, ipcMain } = require("electron");
// var app           = electron.app;
// var BrowserWindow = electron.BrowserWindow;
// var ipcMain       = electron.ipcMain;
var fs            = require("fs");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;

// Keep a global reference to the config file.
var config = null;

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

ipcMain.on("core", function(event, args) {
    if(args[0].toUpperCase() === "PRESTART") {
        mainWindow.send("core", ["START", {
            userDataDir: app.getPath("userData")
        }]);
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    loadConfig()
        .then(() => {
            startApp();
        })
        .catch(err => {
            console.log(err);
        });
});

function loadConfig() {
    return new Promise(function(resolve, reject) {
        fs.readFile(app.getPath("userData") + "/main-config.json", function(err, data) {
            if(err && err.code === "ENOENT") {
                createDefaultConfig();
                resolve();
            }
            else if(err) {
                reject(err);
            }
            else {
                config = JSON.parse(data.toString());
                resolve();
            }
        });
    });
};

function createDefaultConfig() {
    let { screen } = require("electron");
    let primaryDisplay = screen.getPrimaryDisplay();
    let workArea       = primaryDisplay.workArea;
    let windowWidth    = 1280;
    let windowHeight   = 720;

    config = {
        window: {
            width: windowWidth,
            height: windowHeight,
            x: workArea.x + Math.floor(workArea.width / 2 - windowWidth / 2),
            y: workArea.y + Math.floor(workArea.height / 2 - windowHeight / 2),
            fullscreen: false
        }
    };
};

function startApp() {
    createDefaultConfig();
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: config.window.width, height: config.window.height, x: config.window.x, y: config.window.y });

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    // Remove menu bar
    mainWindow.setMenu(null);

    // Open the devtools.
    mainWindow.webContents.on("devtools-opened", function() {
        mainWindow.focus();
    });
    if(cliOptions.debug) {
        mainWindow.webContents.openDevTools({ mode: "detach" });
        mainWindow.webContents.on("dom-ready", function() {
            mainWindow.webContents.send("core", ["debug"]);
        });
    }

    // Emitted when the window is closed.
    mainWindow.on('close', function() {
        let size = mainWindow.getSize();
        let pos  = mainWindow.getPosition();

        config.window.width  = size[0];
        config.window.height = size[1];
        config.window.x      = pos[0];
        config.window.y      = pos[1];

        fs.writeFileSync(app.getPath("userData") + "/main-config.json", JSON.stringify(config));

        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
};
