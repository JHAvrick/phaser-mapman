class PropertyView {
	
	constructor(game){
		this.game = game;
		this.events = new EventManager();
		this.grid = document.getElementById('prop-grid');
		this.propertyInput = document.getElementById('prop-grid-input');
		this.inputs = {};

		this.propertyInput.addEventListener('change', (event) => {
			this.events.trigger('propertyAdded', this.propertyInput.value.replace(/\s/g,'') );
			this.propertyInput.value = '';
		});
	}

	clear(){
		while (this.grid.firstChild) {
			this.grid.removeChild(this.grid.firstChild);
		}
		this.inputs = {};
	}

	add(name, editorMeta, value){
		if (this.inputs[name]){ return; }

		var propRow = this.getTableRow();
		var row = propRow.row;
		var removeBtn = propRow.removeBtn;
		var editor = this.getEditor(editorMeta, name, value);

		propRow.nameCell.innerHTML = name;
		propRow.valueCell.appendChild(editor);

		removeBtn.addEventListener('click', (event) => {
			this.events.trigger('propertyRemoved', name);

			propRow.row.parentNode.removeChild(propRow.row);
		});

		if (editorMeta.isParameter){
			removeBtn.disabled = true;
		}

		this.inputs[name] = editor;

		return editor;
	}

	addAll(object){
		for (var name in object){
			this.add(name, object[name].meta, object[name].value);
		}
	}

	set(name, value){
		if (this.inputs[name] !== undefined){
			this.inputs[name].value = this.sanitize(this.inputs[name].type, value);
		}
	}

	setAll(object){
		for (var name in object){
			this.set(name, object[name].value);
		}
	}

	getTableRow(){
		var row = this.grid.insertRow(0);
			row.className = 'prop-row';

		var nameCell = row.insertCell(0);
			nameCell.className = 'prop-name-cell';

		var valueCell = row.insertCell(1);
			valueCell.className = 'prop-input-cell';

		var btnCell = row.insertCell(2);
			btnCell.className = 'remove-btn-cell';
			btnCell.tabIndex = -1;

		var removeBtn = document.createElement('button');
			removeBtn.className = 'remove-prop-btn';
			removeBtn.innerHTML = 'x';
			removeBtn.tabIndex = -1;

		btnCell.appendChild(removeBtn);

		return { row: row, 
				 nameCell: nameCell, 
				 valueCell: valueCell, 
				 removeBtn: removeBtn }
	}	


	sanitize(type, value){

		switch (type){
			case 'color':
					if (typeof value === 'number'){
						var rgb = this.numberToColor(value);
							value = this.rgbToHex(rgb[0], rgb[1], rgb[2]);
					}
				break;
			case 'select-one':
			case 'option':

				break;
		}

		return value;
	}

	getEditor(editorMeta, name, value){

		switch (editorMeta.type){
			case undefined:
					return this.getTextEditor(editorMeta, name, value);
				break;
			case 'text':
					return this.getTextEditor(editorMeta, name, value);
				break;
			case 'number':
					return this.getNumberEditor(editorMeta, name, value);
				break;
			case 'color':
					return this.getColorEditor(editorMeta, name, value);
				break;
			case 'option':
			case 'select':
					return this.getOptionEditor(editorMeta, name, value);
				break;
			case 'checkbox':
			case 'boolean':
					return this.getCheckBoxEditor(editorMeta, name, value);
				break;
		}
	}

	getTextEditor(meta, name, value){
		var uneditable = meta.uneditable !== undefined ? meta.uneditable : false;
		var value = value !== undefined ? value : '';
		
		var input = document.createElement('input');
			input.disabled = uneditable;
			input.type = 'text';
			input.value = value;

			input.addEventListener('change', (event) => {
				this.events.trigger('propertyEdited', name, input.value);
			});

		return input;
	}

	getNumberEditor(meta, name, value){
		var input = document.createElement('input');
			input.type = 'number';
			input.disabled = meta.uneditable !== undefined ? meta.uneditable : false;
			input.min = meta.min ? meta.min : -100000;
			input.max = meta.max ? meta.max :  100000;
			input.step = meta.step ? meta.step : 1;
			input.value = value !== undefined ? value: 0;

			input.addEventListener('change', (event) => {
				this.events.trigger('propertyEdited', name, input.value);
			});

			input.addEventListener('click', (event) => {
				this.events.trigger('propertyEdited', name, input.value);
			});

		return input;
	}


	getCheckBoxEditor(meta, name, value){
		var input = document.createElement('input');
			input.type = 'checkbox';
			input.disabled = meta.uneditable !== undefined ? meta.uneditable : false;
			input.checked = value !== undefined ? value: true;

			input.addEventListener('change', (event) => {
				this.events.trigger('propertyEdited', name, input.checked);
			});

		return input;
	}

	getColorEditor(meta, name, value){
		var input = document.createElement('input');
			input.type = 'color';
			input.disabled = meta.uneditable !== undefined ? meta.uneditable : false;
			input.value = value !== undefined ? this.sanitize('color', value): '#ffffff';

			input.addEventListener('input', (event) => {
				this.events.trigger('propertyEdited', name, parseInt(input.value.replace('#', '0x', 16)));
			});

		return input;
	}

	numberToColor(num) {
	    num >>>= 0;
	    var b = num & 0xFF,
	        g = (num & 0xFF00) >>> 8,
	        r = (num & 0xFF0000) >>> 16,
	        a = ( (num & 0xFF000000) >>> 24 ) / 255 ;
	    return [r, g, b, a];
	}
	
	//This method was borrowed from here: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
	rgbToHex(r, g, b) {
	    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	}

	//Options can either be an array of strings or an array of objects denoting different display/value pairs, or a mix of the two
	getOptionEditor(meta, name, value){
		var options = meta.options ? meta.options : [];

		var select = document.createElement('select');
		for (let i = 0; i < options.length; i++){
			var option = document.createElement('option');

				if (options[i] !== null && typeof options[i] === 'object'){
					option.innerHTML = options[i].name;
					option.value = options[i].value;
				} else {
					option.innerHTML = options[i];
					option.value = options[i];
				}

			select.appendChild(option);
		}

		select.disabled = meta.uneditable !== undefined ? meta.uneditable : false;
		select.value = value !== undefined ? value : 0;

		select.addEventListener('change', (event) => {
			this.events.trigger('propertyEdited', name, select.value);
		});

		return select;
	}



}

module.exports = PropertyView;