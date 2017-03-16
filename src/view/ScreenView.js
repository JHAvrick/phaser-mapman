const Sortable = require('sortablejs');
const HTMLElementWrapper = require('./Elementary.js').HTMLElementWrapper;
const Input = require('./Elementary.js').Input;

class ScreenView extends Sortable {
	constructor(elementId, options){
		super(document.getElementById(elementId), options);

		this.container = document.getElementById(elementId);

		this.frameIdIndex = 0;
		this.frames = new Map();

	
	}

	addScreen(width, height, color){
		var width = width ? width : 600;
		var height = height ? height: 800;
		var color = color ? color: '#ffffff';

	
	}


}


module.exports = ScreenView;