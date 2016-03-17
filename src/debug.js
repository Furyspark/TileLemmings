var ipcRenderer = ipcRenderer || require("electron").ipcRenderer;

ipcRenderer.send("debug", ["devtools", "open"]);
