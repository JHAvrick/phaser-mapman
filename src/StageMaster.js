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

	newStage(){
		var stage = this.factory.create();

		this.pool.add(stage);
		this.setActive(stage.id);

		return stage;
	}

	setActive(id){
		var stage = this.pool.getStage(id)

		if (stage){
			this.active = stage;
		}
	}

	action(actionObj){
		this.active.action(actionObj);
	}
}

class StageFactory {

	constructor(game){
		this.game = game;

		this.stageKeyIndex = 0;
		this.stageIdIndex = 0;
	}

	create(){
		return new Stage('stage-' + this.stageIdIndex++, 'New Stage ' + this.stageKeyIndex++, this.game);
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

class Stage {

	constructor(id, key, stage){
		this.stage = stage;

		this.id = id;
		this.active = false;
		this.actions = new ActionStack();
		this.all = new ObjectPool();
		this.layers = {};
		this.groups = {};

	}

	action(actionObj){
		this.actions.register(actionObj);
	}

	activate(){
		this.all.modifyAll(function(wrapper){

			wrapper.activate();

		}.bind(this));
	}

	deactivate(){

	}

	addLayer(key){
		if (!this.layers[key]){
			this.layers[key] = new ObjectPool();

			return this.layers[key];
		}

		return false;
	}

	addToLayer(key, wrapper){
		if (this.layers[key]){
			this.layers[key].add(wrapper);
			
			return;
		}

		return false;
	}

	removeLayer(key){
		if (this.layers[key]){
			delete this.layers[key];
		}
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
			this.stack[0].undo.apply(this.stack[0].context, this.stack[0].params);
			this.stack.shift();
		}
	}

}