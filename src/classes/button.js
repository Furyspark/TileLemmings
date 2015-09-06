var GUI_Button = function(x, y, width, height) {
	GUI.call(this, x, y);
	this.width = width;
	this.height = height;
};

GUI_Button.constructor = Object.create(GUI.constructor);
GUI_Button.constructor.prototype = GUI_Button;