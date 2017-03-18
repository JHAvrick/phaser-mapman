class ObjectMaster {
	constructor(game){
		this.game = game;

		this.factory = new ObjectFactory(game);
		this.pool = new ObjectPool(game);
	}

	reset(){
		this.pool.clear();
	}

	newObject(definition, imageKey){
		var obj = this.factory.create(definition, imageKey);
		
		this.pool.add(obj);

		return obj;
	}

}

//Responsible for building objects
class ObjectFactory {

	constructor(game){
		this.game = game;
		this.idIndex = 1;
	}

	create(definition, imageKey){

		//Check 
		switch(definition.extends){
			case "PIXI.Sprite":
				if (definition.name === 'Sprite'){

					var display = new Phaser.Sprite( this.game, 0, 0, imageKey );

				} else if (definition.name === 'Image'){

					var display = new Phaser.Image( this.game, 0, 0, imageKey );

				}
				break;
			case "Phaser.Sprite":
				break;
			case "Phaser.Image":
				break;
			case "Phaser.Button":
				break;
			case "Phaser.TileSprite":
				break;
		}

		var wrapper = new Wrapper( definition, this.idIndex++, this.game, display );

		return wrapper;
	}

	addType(){

	}

	getBlank(type){

	}

	getDupe(key){


	}
}

//Responsible for keeping a pool of ALL existing objects and modifying all objects globally
//Not responsible for creating, deleting, categorizing them
class ObjectPool {

	constructor(stage){
		this.stage = stage;
		this.birthModifiers = [];
		this.addDeathModifiers = [];

		this.pool = {};
	}

	clear(){
		this.pool = {};
	}

	add(wrapper){
		this.applyBirthModifiers(wrapper);

		this.pool[wrapper.id] = wrapper;
	}

	get(id){
		return this.pool[id];
	}

	addAll(objects){

	}

	remove(wrapperId){
		this.applyDeathModifiers(this.pool[wrapperId]);
		delete this.pool[wrapperId];
	}

	removeAll(){
		for (var wrapperId in this.pool){
			this.applyDeathModifiers(this.pool[wrapperId]);
			delete this.pool[wrapperId];
		}
	}

	contains(wrapper){
		if (this.pool[wrapper.id] !== undefined){
			return true;
		}
	}

	getAllAsArray(){
		var pool = [];
		for (var wrapperId in this.pool){
			pool.push(this.pool[wrapperId]);
		}

		return pool;
	}

	modifyAll(modifier){
		for (var wrapperId in this.pool){
			modifier(this.pool[wrapperId]);
		}
	}

	//Called and passed each object when it is added to the pool
	addBirthModifier(modifier){
		this.birthModifiers.push(modifier);
	}

	//Called and passed before an object is removed from the pool
	addDeathModifier(modifier){
		this.deathModifiers.push(modifier);
	}	

	applyBirthModifiers(wrapper){
		for (var i = 0; i < this.birthModifiers.length; i++){
			this.birthModifiers[i](wrapper);
		}
	}

	applyDeathModifiers(wrapper){
		for (var i = 0; i < this.deathModifiers.length; i++){
			this.deathModifiers[i](wrapper);
		}
	}

}
