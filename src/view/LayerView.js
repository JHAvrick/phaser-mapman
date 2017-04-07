
//EVENTS
	// layerSwitched - return layer id
	// objectSelected - return object id
	// layer hidden 
	// layer unhidden
	// layer added - return layer id
	// object added - return obj id

class LayerView {
	constructor(){
		this.events = new EventManager();

		//DOM components
		this.tree = document.getElementById('layer-view');
		this.addLayerBtn = document.getElementById('btn-add-layer');
		this.delLayerBtn = document.getElementById('btn-remove-layer');

		this.layerIdIndex = 0;
		this.activeLayer = undefined; //Holds reference to active LayerNode 

		this._events();

	}

	_events(){

		this.tree.on('nodeSelected', e => {

			var node = e.data.node;

			if (node instanceof LayerNode){
				if (node === this.activeLayer) return;
				
				this.activeLayer = node;
				this.events.trigger('layerSwitched',  this.activeLayer.key);

			} else if (node instanceof ObjectNode){

				//if object selected is not a child of the active layer, switch the active layer
				if (node.parent !== this.activeLayer.key){

					this.activeLayer = this.tree.getNode(node.parent);
					this.events.trigger('layerSwitched', this.activeLayer.key);

				}

				this.events.trigger('objectSelected', node.key);

			}

		});

		this.tree.on('layerToggled', e => {

			if (!e.data.state) //i.e. toggle state is OFF
				this.events.trigger('layerHidden', e.data.node.key);
			else 
				this.events.trigger('layerUnhidden', e.data.node.key);

		});

		this.tree.on('nodeMoved', e => {

			var node = e.data.node;

			if (node instanceof LayerNode)
				this.events.trigger('layerMoved', this.tree.getNodeOrder());

		});

		this.tree.on('layerNameEdited', e => {
			this.events.trigger('layerNameEdited', e.data.node.key, e.data.value);
		});

		//Toolbar events
		this.addLayerBtn.addEventListener('click', (event) => { this.addLayer(); });
		this.delLayerBtn.addEventListener('click', (event) => { this.removeSelectedLayer(); });

	}


	addLayer(suppressEvent){
		var layer = this.tree.addNode({
			key: 'layer-' + this.layerIdIndex++,
			type: LayerNode
		});

		layer.name = layer.key;

		if (!suppressEvent)
			this.events.trigger('layerAdded', layer.key);

		return layer.key;
	}

	selectLayer(layerId){
		this.tree.select(layerId);
	}

	selectObject(objectId){
		this.tree.select(objectId, true);
	}

	getActiveLayer(){
		return this.activeLayer;
	}

	addObject(wrapper){

		var objectNode = this.tree.addNode({
			parent: this.activeLayer,
			key: wrapper.id,
			type: ObjectNode
		});

		objectNode.name = wrapper.name;

		this.activeLayer.expand();

		this.events.trigger('objectAdded', objectNode.key);

	}

	addObjects(wrappers){
		wrappers.forEach((wrapper) => {
			this.addObject(wrapper);
		});
	}

	removeObject(wrapper){
		this.tree.removeNode(wrapper.id);
	}

	removeObjects(wrappers){
		wrappers.forEach( wrapper => {
			this.tree.removeNode(wrapper.id);
		});
	}

	setObjectName(wrapperId, name){
		this.tree.getNode(wrapperId).name = name;
	}

	removeSelectedLayer(){
		if (this.tree.children.size === 1){ return; }

		if (this.tree.selected instanceof LayerNode){

			this.events.trigger('layerDeleted', this.tree.selected.key);
			this.tree.removeNode(this.tree.selected);
			this.tree.select(this.tree.children.entries().next().value[1]);

		}
	}

	numOfLayers(){
		return this.tree.numOfChildren();
	}

	getLayerOrder(){
		return this.tree.getNodeOrder();
	}

}

module.exports = LayerView;