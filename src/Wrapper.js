class Wrapper {

	constructor(definition, id, key, stage, displayObject){

		this.definition = definition;
		this.id = id;	//Used internally to keep track of objects
		this.name = "object-" + this.id;

		this.deleted = false;	//Deleted flag, deleted objects are not permanently destroyed until the app is closed
		this.hidden = false;
		this.key = key;
		this.stage = stage;
		this.display = displayObject;
		this.group = 'all';
		this.layer = 0;
		this.isSelected = false;
		this.lastX = 0;
		this.lastY = 0;

		this.trackedParameters = {};
		this.trackParameters(this.definition.parameters);
		
		this.trackedProperties = {};
		this.trackProperties(this.definition.properties); //Automatically track any properties preset in the object defintion

		this.bounds = this.stage.add.graphics(0, 0);
		this.bounds.beginFill(0x00ff00, .2);
		//this.bounds.lineStyle(3, 0x00ff00, 2);
		this.bounds.drawRect(0, 0, this.display.getBounds().width, this.display.getBounds().height);
		this.bounds.visible = false;
		
		this.display.wrapper = this;
		this.display.inputEnabled = true;
		this.display.input.enableDrag();
		this.display.input.pixelPerfectOver = true;
		this.display.input.pixelPerfectAlpha = 50;
		this.display.update = this.update.bind(this);

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

	trackParameters(meta){
		var tracked = {};
		for (var paramName in meta){

			tracked[name] = {};
			tracked[name].meta =  _.clone(meta[param]);
			tracked[name].value = this.resolveParamValue(name, tracked[name]);

		}

		return tracked;
	}

	//Resolves the value of a param based on one of three possible meta flags
	resolveParamValue(name, param){
		switch (param.meta.type){

			//For special parameters (such as the Phaser Game instance)
			case 'special':
						return param.meta.value;
					break;

			//Manual parameters are set by user input and not fetched from the tracked properties
			case 'manual':
						return param.meta.value;
					break;

			//Linked values must have a corresponding entry 
			case 'link':
					if (this.trackedProperties[name] !== undefined){

						this.trackedProperties[name].meta.isParameter = true; //In case the flag has not been set for some reason
						return this.trackedProperties[name].value;

					} else {

						return this.trackProperty(name, false, true).value;

					}
					break;
		}
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

	refreshTracked(){
		for (var prop in this.trackedProperties){
			if (this.resolve(this.display, prop) !== undefined){
				this.trackedProperties[prop].value = this.resolve(this.display, prop);

				//Also set the corresponding parameter value, if the two are linked
				if (this.trackedParameters[prop] && this.trackedParameters[prop].meta.type === 'link'){

					this.trackedParameters[prop].valie = this.trackedProperties[prop].value;

				}

			}
		}
	}

	getTracked(){
		this.refreshTracked(); //Refresh to ensure data is current
		return this.trackedProperties;
	}

	//Add multiple properties to track
	trackProperties(properties, forceValue){
		for (var prop in properties){
			this.trackProperty(prop, forceValue);
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


		this.trackedProperties[property] = {};
		this.trackedProperties[property].value = this.resolve(this.display, property);
		this.trackedProperties[property].meta = this.definition.propertyMeta[property] ?  _.clone(this.definition.propertyMeta[property]) : { type: 'text' };
		this.trackedProperties[property].meta.isParameter = isParameter; //Properties linked to parameters cannot be removed

		return {name: property, value: this.trackedProperties[property].value, meta: this.trackedProperties[property].meta };
	}

	linkParam(name){

		this.trackedParameters[name].meta.type = 'link';
		this.trackedProperties[name].meta.isParameter = true;
		this.trackedParameters[name].value = this.trackedProperties[name].value;

	}

	unlinkParam(name){

		this.trackedParameters[name].meta.type = 'manual';
		this.trackedProperties[name].meta.isParameter = false;

	}

	untrack(property){
		delete this.trackedProperties[property];
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

	setLastPosition(){
		this.lastX = this.display.x;
		this.lastY = this.display.y;
	}

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