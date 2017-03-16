const Sortable = require('sortablejs');
const HTMLElementWrapper = require('./Elementary.js').HTMLElementWrapper;
const Input = require('./Elementary.js').Input;

class ScreenView extends Sortable {
	constructor(elementId, options){
		super(document.getElementById(elementId), options);

		this.container = document.getElementById(elementId);

		this.frameIdIndex = 0;
		this.frames = new Map();

		this.addScreen();
	}

	addScreen(width, height, color){
		var width = width ? width : 600;
		var height = height ? height: 800;
		var color = color ? color: '#ffffff';

		this.frames.set(this.frameIdIndex++, new ScreenViewListItem(this.container, width, height, color));

		/*
		var input = Elementary.make({
										type: 'input',


									});

					Element({})
					*/

		//return screenItem;
	}


}

class ScreenViewListItem extends HTMLElementWrapper {
	constructor(parent, width, height, color){
		super(parent, 'li', { className: 'screenview-item' });

		this.widthInput = new Input(this, { type: 'number', value: width  });
		this.heightInput = new Input(this, { type: 'number', value: height });
		this.colorInput = new Input(this, { type: 'color', value: color });

	}

}

module.exports = ScreenView;