var gui = require("nw.gui");
var win = gui.Window.get();


win.resizeContent = function(innerWidth, innerHeight) {
	var chromeWidth = this.window.outerWidth - this.window.innerWidth;
    var chromeHeight = this.window.outerHeight - this.window.innerHeight;
    this.resizeTo(innerWidth + chromeWidth, innerHeight + chromeHeight);
};

win.resizeContent(800, 600);

// win.onResize = function(newWidth, newHeight) {
// 	document.getElementById("content").style.width = win.window.innerWidth;
// 	document.getElementById("content").style.height = win.window.innerHeight;
// };

// win.on("resize", win.onResize);
// win.on("maximize", function() {
// 	win.onResize(-1, -1);
// });