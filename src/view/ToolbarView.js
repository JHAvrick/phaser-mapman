class ToolbarView {

	constructor(){
		this.events = new EventManager();

		this.btns = {};
		this.toggleBtns = {};
		this.radioGroups = {};

	}

	btn(name, selector){
		this.btns[name] = {};
		this.btns[name].element = document.getElementById(selector);
		this.btns[name].element.addEventListener('click', (event) => {
			this.events.trigger(name + 'Clicked');
		});
	}

	toggleBtn(name, selector){

		this.toggleBtns[name] = {};
		this.toggleBtns[name].active = false;
		this.toggleBtns[name].element = document.getElementById(selector);
		this.toggleBtns[name].element.addEventListener('click', (event) => {

			if (this.toggleBtns[name].active){

				this.toggleBtns[name].element.style.backgroundColor = "white";
				this.toggleBtns[name].active = false;

			} else {

				this.toggleBtns[name].element.style.backgroundColor = "lightgreen";
				this.toggleBtns[name].active = true;

			}

			this.events.trigger(name + 'Toggled', this.toggleBtns[name].active);

		});

	}

	radioGroup(groupName, radios){

		this.radioGroups[groupName] = {};

		for (var i = 0; i < radios.length; i++){
			let radio = radios[i];
			
			this.radioGroups[groupName][radio.name] = {};
			this.radioGroups[groupName][radio.name].name = radio.name;
			this.radioGroups[groupName][radio.name].active = false;
			this.radioGroups[groupName][radio.name].element = document.getElementById(radio.selector);
			
			this.radioGroups[groupName][radio.name].element.addEventListener('click', function(event) {

				let eventGroup = groupName;
				let eventRadio = radio.name; 

				this.toggleRadio(eventGroup, eventRadio);

				this.events.trigger(eventGroup + 'Toggled', eventRadio, this.radioGroups[groupName][eventRadio].active);

			}.bind(this));
			
		}

	}

	toggleRadio(groupName, radioToToggle){
		var group = this.radioGroups[groupName];
		var radio = group[radioToToggle];

		if (radio.active){

			this.off(groupName, radioToToggle);

		} else {

			this.on(groupName, radioToToggle);

		}

		for (var radio in group){
			if (radio !== radioToToggle){
				this.off(groupName, radio);
			}
		}

	}

	on(groupName, radioName){
		var group = this.radioGroups[groupName];
		var radio = group[radioName];

		radio.element.style.backgroundColor = "lightgreen";
		radio.active = true;
	}

	off(groupName, radioName){
		var radio = this.radioGroups[groupName][radioName];

		radio.element.style.backgroundColor = "white";
		radio.active = false;
	}

}

module.exports = ToolbarView;