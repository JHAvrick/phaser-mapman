// Master
//	└── Factory
//	└── Pool
//		 └── Stage
//			  └── All Objects (wrappers)
//			  └── Layers (lookup by key)
//			  └── Groups (lookup by key)

class StageMaster {

	constructor(game){
		this.game = game;

		this.pool = new StagePool(this.game);
		this.factory = new StageFactory(this.game); 

		this.active = undefined;
	}

	reset(){
		//TO DO: Create an actual reset function
	}

	newStage(){
		var stage = this.factory.create();

		this.pool.add(stage);
		this.setActiveStage(stage.id);

		return stage;
	}

	setActiveStage(id){
		var stage = this.pool.getStage(id);

		if (stage){
			this.active = stage;
		}
	}

	setActiveLayer(id){
		this.active.setActiveLayer(id);
	}

	action(actionObj){
		this.active.action(actionObj);
	}

	undo(){
		this.active.undo();
	}
}

class StageFactory {

	constructor(game){
		this.game = game;

		this.stageKeyIndex = 0;
		this.stageIdIndex = 0;
	}

	create(){
		return new Scene('stage-' + this.stageIdIndex++, 'New Stage ' + this.stageKeyIndex++, this.game);
	}

}

class Scene {

	constructor(id, key, game){
		this.game = game

		this.id = id;
		this.key = key;
		this.active = false;
		//this.actions = new ActionStack();
		this.all = new ObjectPool();
		this.groups = {};	//Each group is an object pool

		this.layers = {};	//Each layer is an object pool
		this.activeLayer = undefined;

	}

	action(actionObj){
		this.activeLayer.actions.register(actionObj);
	}

	undo(){
		this.activeLayer.actions.undo();
	}

	activate(){
		this.all.modifyAll(function(wrapper){

			wrapper.activate();

		}.bind(this));
	}

	deactivate(){

	}

	add(wrapper){
		this.all.add(wrapper);
		this.activeLayer.objects.add(wrapper);
	}

	newLayer(id){
		if (!this.layers[id]){
			this.layers[id] = { name: id, actions: new ActionStack(), objects: new ObjectPool() };

			return id;
		}

		return false;
	}

	removeLayer(id){
		if (this.layers[id]){
			delete this.layers[id];
		}
	}

	addToLayer(id, wrapper){
		if (this.layers[id]){
			this.layers[id].objects.add(wrapper);
			
			return;
		}

		return false;
	}

	setActiveLayer(id){
		if (this.layers[id]){
			this.activeLayer = this.layers[id];
		}
	}

	getActiveLayerObjects(){
		return this.activeLayer.objects.getAllAsArray();
	}


	addGroup(key){
		if (!this.groups[key]){
			this.groups[key] = new ObjectPool();

			return this.groups[key];
		}

		return false;
	}

	addToGroup(key, wrapper){
		if (this.groups[key]){
			this.groups[key].add(wrapper);
			
			return;
		}

		return false;
	}


	removeGroup(key){
		if (this.groups[key]){
			delete this.groups[key];
		}
	}
}

class ActionStack {

	constructor(){
		this.stack = [];
	}

	register(action){
		this.stack.unshift(action);
	}

	undo(){
		if (this.stack[0]){
			this.stack[0].undo()
			this.stack.shift();
		}
	}

}

class StagePool {

	constructor(game){
		this.game = game;
		this.birthModifiers = [];
		this.addDeathModifiers = [];

		this.pool = {};
	}

	add(stage){
		this.applyBirthModifiers(stage);

		this.pool[stage.id] = stage;
	}

	addAll(objects){

	}

	remove(stageId){
		this.applyDeathModifiers(this.pool[stageId]);
		delete this.pool[stageId];
	}

	removeAll(){
		for (var stageId in this.pool){
			this.applyDeathModifiers(this.pool[stageId]);
			delete this.pool[stageId];
		}
	}

	getStage(id){
		return this.pool[id];
	}

	getAllAsArray(){
		var pool = [];
		for (var stageId in this.pool){
			pool.push(this.pool[stageId]);
		}

		return pool;
	}

	modifyAll(modifier){
		for (var stageId in this.pool){
			modifier(this.pool[stageId]);
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

	applyBirthModifiers(stage){
		for (var i = 0; i < this.birthModifiers.length; i++){
			this.birthModifiers[i](stage);
		}
	}

	applyDeathModifiers(stage){
		for (var i = 0; i < this.deathModifiers.length; i++){
			this.deathModifiers[i](stage);
		}
	}
}