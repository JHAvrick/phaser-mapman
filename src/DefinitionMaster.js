class DefinitionMaster {

	constructor(game){
		this.game = game;
		this.definitions = {};
		this.activeDefinition = undefined;
	}

	add(name, def){
		this.definitions[name] = def;
	}

	addAll(arr){
		arr.forEach((definition) => {
			if (definition){	//Check for null values, FileAccess returns undefined for any JSON that fails to parse
				this.definitions[definition.name] = definition;
			}
		});
	}

	setActive(name){
		if (this.definitions[name]){
			this.activeDefinition = this.definitions[name];
		} else {
			this.activeDefinition = this.defintions[Object.keys(this.definitions)[0]]; // Default to first definition key
		}
	}

	getActive(){
		return this.activeDefinition;
	}

	getNames(){
		var names = []; //Just the keys
		for (var name in this.definitions){
			names.push(name);
		}
		return names;
	}
}

module.exports = DefinitionMaster;