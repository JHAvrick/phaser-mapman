class Wrapper {

	constructor(definition, id, key, stage, displayObject){

		this.definition = definition; //Holds meta information about properties and how they should be applied
		this.id = id;	//Used internally to keep track of objects independant of their user-designated keys
		this.key = key;
		this.name = "object-" + this.id;
		this.display = displayObject; //The actual display object we care about (i.e. Sprite, Image, etc.)
		this.stage = stage; //Game reference

		//Flags
		this.deleted = false;
		this.hidden = false;
		this.group = 'all';
		this.layer = 0;
		this.isSelected = false;
		this.lastX = 0;
		this.lastY = 0;

		//Front-load any params/properties already set in the object definition
		this.trackedProperties = {};
		this.trackedParameters = {};

		this.trackProperties(this.definition.properties); //Properties should be tracked first as params may depend on their values
		this.trackParameters(this.definition.parameters);
		

		//The 'Select Box' shown around the display object when it is selected, position set in the update loop
		this.bounds = this.stage.add.graphics(0, 0);
		this.bounds.beginFill(0x00ff00, .2);
		this.bounds.drawRect(0, 0, this.display.getBounds().width, this.display.getBounds().height);
		this.bounds.visible = false;
		
		//Some config on the display object that we are wrapping
		this.display.wrapper = this;
		this.display.inputEnabled = true;
		this.display.input.enableDrag();
		this.display.input.pixelPerfectOver = true;
		this.display.input.pixelPerfectAlpha = 50;
		this.display.update = this.update.bind(this);

		this.label = this.stage.add.text(this.bounds.x + 5, this.bounds.y + 5, this.name, { font: "12px Arial", fill: "#fff" });
		this.bounds.addChild(this.label);

		//Events to record 'Object Moved' operation
		this.display.events.onDragStart.add(this.setLastPosition, this);
		this.display.events.onDragStop.add(this.registerMoveAction, this);
	}

	update(){
		if (this.isSelected){
			this.bounds.x = (this.display.x - this.display.offsetX);
			this.bounds.y = (this.display.y - this.display.offsetY);
			this.bounds.width = this.display.width;
			this.bounds.height = this.display.height;
		}
	}

	setName(name){
		this.name = name;
		this.label.setText(this.name);
	}

	linkParam(name){
		if (!this.trackedProperties[name]){

			this.trackedParameters[name].value = this.trackProperty(name, false, true).value;
			this.trackedParameters[name].meta.type = 'link';

			return;

		}

		this.trackedParameters[name].meta.type = 'link';
		this.trackedProperties[name].meta.isParameter = true;
		this.trackedParameters[name].value = this.trackedProperties[name].value;
	}

	unlinkParam(name){
		this.trackedParameters[name].meta.type = 'manual';
		this.trackedProperties[name].meta.isParameter = false;
	}

	toggleParamLink(name){
		if (this.trackedParameters[name].meta.type === 'link'){
			this.unlinkParam(name);
		} else {
			this.linkParam(name);
		}
	}

	setParamValue(name, value){
		this.trackedParameters[name].value = value;
	}

	//Tracks all parameter keys in an object, sets value based on meta flags
	trackParameters(params){
		for (var name in params){

			this.trackedParameters[name] = {};
			this.trackedParameters[name].meta =  this.definition.parameterMeta[name] != undefined ? _.clone(this.definition.parameterMeta[name]) : { type: 'manual' };

			//Get value from object definition if it is to be set manually
			if (this.trackedParameters[name].meta.type == 'manual'){

				this.trackedParameters[name].value = params[name].value; //May be null

			//To resolve special variables such as the Phaser "Game" instance
			} else if (this.trackedParameters[name].meta.type == 'special')  {

				this.trackedParameters[name].value = 'GAME'; //The only special variable as of current

			//To resolve parameters whose values are bound to the values of properties
			} else if (this.trackedParameters[name].meta.type == 'link'){

				//If property is already being tracked, grab its value
				if (this.trackedProperties[name] != undefined){

					this.trackedProperties[name].meta.isParameter = true; //In case the flag has not been set for some reason
					this.trackedParameters[name].value = this.trackedProperties[name].value;

				//Otherwise, track it
				} else {

					this.trackedParameters[name].value = this.trackProperty(name, false, true).value;

				}	

			}

		}

	}

	//If forceValue is true, the value should be fetched from the definition properties and applied to the display first
	//Otherwise, the value should bubble up from the display object
	trackProperty(property, forceValue, isParameter){
		var meta = this.definition.propertyMeta[property];

		if (meta){
			if (meta.doNotShow == true){
				return false;
			}

			if (meta.spread !== undefined){
				
				var properties = [];
				meta.spread.forEach((property) => {
					properties.push(this.trackProperty(property));
				});

				return properties;
			}
		}

		//Try to resolve the property
		var value = this.resolve(this.display, property);

		//If it can't be resolved, create a new property directly of the display object and fetch its value from the defintion, or 0 if that fails
		if (value === undefined){

			this.display[property] = this.definition.properties[property] !== undefined ? this.definition.properties[property] : 0;
		
		//if we want to SET the value before we GET it (whether it resolved or not), fetch the value from the definition
		//If that value is undefined, ignore this and use the originally resolved value
		} else if (forceValue) {

			this.display[property] = this.definition.properties[property] !== null ? this.definition.properties[property] : value;

		}

		//Build the property and meta
		this.trackedProperties[property] = {};
		this.trackedProperties[property].value = this.resolve(this.display, property);
		this.trackedProperties[property].meta = this.definition.propertyMeta[property] ?  _.clone(this.definition.propertyMeta[property]) : { type: 'text' };
		this.trackedProperties[property].meta.isParameter = isParameter; //Properties linked to parameters cannot be removed

		return {name: property, value: this.trackedProperties[property].value, meta: this.trackedProperties[property].meta };
	}

	//Add multiple properties to track
	trackProperties(properties, forceValue){
		for (var prop in properties){
			this.trackProperty(prop, forceValue);
		}
	}

	refreshTracked(){
		for (var prop in this.trackedProperties){
			if (this.resolve(this.display, prop) !== undefined){
				this.trackedProperties[prop].value = this.resolve(this.display, prop);

				//Also set the corresponding parameter value, if the two are linked
				if (this.trackedParameters[prop] && this.trackedParameters[prop].meta.type === 'link'){

					this.trackedParameters[prop].value = this.trackedProperties[prop].value;

				}

			}
		}
	}

	getTracked(){
		this.refreshTracked();
		return this.trackedProperties;
	}

	getParams(){
		this.refreshTracked();
		return this.trackedParameters;
	}

	untrack(property){
		delete this.trackedProperties[property];
	}

	//A value from the editor is applied to the display object
	toDisplay(property, value){
		var resolved = this.resolve(this.display, property);

		if (resolved !== undefined){

			if (!this.trackedProperties[property].meta.doNotApply){

				this.assign(this.display, property, value);

				this.trackedProperties[property].value = resolved; //If "doNotApply" is false, fetch the value from actual display

			} else {

				this.trackedProperties[property].value = value; //Otherwise, just use the value provided

			}

		}

	}

	doNotShow(property){
		if (this.definition.propertyMeta[property] !== undefined){
			if (this.definition.propertyMeta[property].doNotShow !== undefined && this.definition.propertyMeta[property].doNotShow !== false){
				return true;
			}
		}

		return false;
	}

	toType(obj) {
		return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
	}

	getProperty(property){
		return this.display[property];
	}

	//Called every time the object is moved to record last position
	setLastPosition(){
		this.lastX = this.display.x;
		this.lastY = this.display.y;
	}

	//Called every time a move operation ends, creating an action which can be undone
	registerMoveAction(){
		if (this.lastX !== this.display.x || this.lastY !== this.display.y){

			var oldX = this.lastX;
			var oldY = this.lastY;

			var self = this;
			MapMan.Stages.action({
				type: 'Moved Object',
				undo: () => {   
					this.display.x = oldX;
					this.display.y = oldY;
				}
			});
		}
	}

	hide(){
		this.hidden = true;
		this.display.visible = false;
	}

	unhide(){
		this.hidden = false;
		this.display.visible = true;
	}

	activate(){
		if (!this.deleted){
			this.display.revive();
			this.bounds.revive();

			if (!this.selected){
				this.bounds.visible = false;
			}
		}
	}

	deactivate(){
		if (!this.deleted){
			this.display.kill();
			this.bounds.kill();
		}
	}

	delete(){
		this.unselect();
		this.deleted = true;
		this.display.kill();
		this.bounds.kill();
		return this;
	}

	undelete(){
		this.deleted = false;
		this.display.revive();
		this.bounds.revive();
		this.bounds.visible = false;
		return this;	
	}

	select(){
		this.stage.world.bringToTop(this.bounds);
		this.isSelected = true;
		this.bounds.visible = true;
	}

	unselect(){
		this.isSelected = false;
		this.bounds.visible = false;
	}

	resolve(obj, path) {
	    return path.split('.').reduce(function(prev, curr) {
	        return prev ? prev[curr] : undefined
	    }, obj || self)
	}

	assign(obj, prop, value){
	    if (typeof prop === "string")
	        prop = prop.split(".");

	    if (prop.length > 1) {
	        var e = prop.shift();
	        this.assign(obj[e] =
	                 Object.prototype.toString.call(obj[e]) === "[object Object]"
	                 ? obj[e]
	                 : {},
	               prop,
	               value);
	    } else
	        obj[prop[0]] = value;
	}

}