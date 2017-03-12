class ParamView {
	constructor(){
		this.events = new EventManager();
		this.list = document.getElementById('object-param-list');
	}

	clear(){
		while (this.list.firstChild) {
			this.list.removeChild(this.list.firstChild);
		}
	}

	add(name, value, meta){
		var element = this.getElement();

		element.label.innerHTML = name;
		element.input.value = value; 

		switch (meta.type) {
			case 'manual':
					element.input.disabled = false;
					element.toggle.backgroundImage = 'url()';
				break;
			case 'link':
					element.input.disabled = true;
					element.toggle.backgroundImage = 'url(resources/icon/icon-link.png)';
				break;
			case 'special':
					element.input.disabled = true;
					element.toggle.disabled = true;
				break;

		}

		element.input.addEventListener('change', (event) => {
			this.events.trigger('parameterEdited', name, value);
		});

		element.toggle.addEventListener('click', (event) => {
			if (meta.type === 'link'){

				element.toggle.backgroundImage = 'url()';

			} else {

				element.toggle.backgroundImage = 'url(resources/icon/icon-link.png)';

			}

			this.events.trigger('parameterLinkToggled', name, value);
		});

	}

	addAll(allMeta){
		for (var name in allMeta){
			this.add(name, allMeta[name].value, allMeta[name].meta);
		}
	}

	getElement(){
		var li = document.createElement('li');
			li.className = 'item-param';
		var label = document.createElement('div');
			label.className = 'item-label';
		var input = document.createElement('input');
			input.disabled = true;

		var toggle = document.createElement('button');
			toggle.style.backgroundImage = 'resources/icon/icon-link.png';

		li.appendChild(label);
		li.appendChild(input);
		li.appendChild(toggle);

		return { label: label, input: input, toggle: toggle };
	}


}

module.exports = ParamView;