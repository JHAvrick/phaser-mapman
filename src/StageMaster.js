// Master
//	└── Factory
//	└── Pool
//		 └── Stage
//			  └── All Objects (wrappers)
//			  └── Layers (lookup by key)
//			  └── Groups (lookup by key)

class SceneMaster {

	constructor(game){
		this.game = game;

		this.sceneIdIndex = 0;
		this.pool = new Map();
		this.Active = undefined;
	}

	reset(){
		//TO DO: Create an actual reset function
	}

	createScene(key){
		var sceneId = 'scene-' + this.sceneIdIndex++;
		var scene = new Scene(sceneId, key || sceneId, this.game);

		this.pool.set(sceneId, scene);
		this.Active = scene;

		return scene;
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

		this.layerOrder = [];	//Holds zOrder state, each element is a layer id
		this.layers = {};	//Each layer contains some meta and an object pool
		this.activeLayer = undefined;  //Points to active layer, to which events will be funneled 

	}

	setLayerOrder(layerIds, restack){
		this.layerOrder = layerIds;

		if (restack)
			this.restack();
	}

	restackAboveActiveLayer(){

		for (var i = this.activeLayer.zOrder; i < this.layerOrder.length; i++){
			this.layers[this.layerOrder[i]].objects.modifyAll((wrapper) => {
				wrapper.display.bringToTop();			
			});
		}
	}

	restack(){
		var layerIds = this.layerOrder;
		for (var i = 0; i < layerIds.length; i++){
			if (this.layers[layerIds[i]]){

				this.layers[layerIds[i]].zOrder = i;
				this.layers[layerIds[i]].objects.modifyAll((wrapper) => {
					wrapper.display.bringToTop();			
				});

			}
		}
	}

	action(actionObj){
		this.activeLayer.actions.register(actionObj);
	}

	unhideLayer(id){
		this.layers[id].hidden = false;
		this.layers[id].objects.modifyAll((wrapper) => {
			wrapper.activate();
		});
	}

	hideLayer(id){
		this.layers[id].hidden = true;
		this.layers[id].objects.modifyAll((wrapper) => {
			wrapper.deactivate();
		});
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
		if (this.activeLayer.hidden){
			wrapper.deactivate();
		}
	}

	addLayer(id, setAsActive){

		if (!this.layers[id]){
			this.layers[id] = 	{ 
								id: id, 
								hidden: false,
								name: id, 
								actions: new ActionStack(),
								objects: new ObjectPool()
								};

			if (setAsActive)
				this.setActiveLayer(id);

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
		if (this.activeLayer){
			this.activeLayer.objects.modifyAll((wrapper) =>{
				wrapper.display.inputEnabled = false;
			});
		}

		if (this.layers[id]){
			this.activeLayer = this.layers[id];
		}

		this.activeLayer.objects.modifyAll((wrapper) =>{
			wrapper.display.inputEnabled = true;
		});
	}

	setLayerName(id, name){
		if (this.layers[id])
			this.layers[id].name = name;
	}

	inActiveLayer(wrapper){
		return this.activeLayer.objects.contains(wrapper);
	}

	deleteActiveLayer(){
		this.activeLayer.objects.modifyAll((wrapper) => {
			wrapper.delete();
		});

		this.layerOrder.splice(this.layerOrder.indexOf(this.activeLayer.id), 1);
		delete this.layers[this.activeLayer.id];
	}

	getActiveLayerObjects(){
		return this.activeLayer.objects.getAllAsArray();
	}

	getWrapper(id){
		return this.activeLayer.objects.get(id);
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