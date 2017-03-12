class LayerView {
	constructor(){
		this.events = new EventManager();

		this.activeLayerId = undefined;
		this.allLayerIds = [];
		this.allBtnIds = [];
		this.btns = [];

		this.nodeState = {};

		$('#layer-tree').jstree({ 
			"core": { 	check_callback: true,
						data: [],
						multiple: false,
						error: function(err){
							//console.log(err);
						},
						'check_callback': function(operation, node, node_parent, node_position, more) {
									// operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
									// in case of 'rename_node' node_position is filled with the new node name

									if (operation === "move_node") {
										if (node.data.type === 'object'){
											return false;
										}
										return node_parent.id === '#'; //Returns true, allowing operation, if the parent node is the root
									}

									return true;  //allow all other operations
						}
					},
			"plugins": ["wholerow", "dnd", "crrm"],
			"dnd": {
				check_while_dragging: true
			}
		});
		this.tree = $.jstree.reference('#layer-tree');

		this.layerIdIndex = 0;

		this.addEvents();

		//Add default layer
		this.addLayer();

	}

	addEvents(){

		$('#layer-tree').on('select_node.jstree', (event, nodeData) => {
			var node = nodeData.node;

			if (node.data.type == 'layer' && node.id !== this.activeLayerId){
				this.tree.deselect_node({ id: this.activeLayerId }); //Deselect previously active layer

				this.activeLayerId = node.id;

				this.events.trigger('layerSwitched', this.activeLayerId);

			} else if (node.data.type == 'object') {

				var parentId = this.getParentId(node.id);

				if (parentId === this.activeLayerId){

					this.events.trigger('objectSelected', node.id);

				} else {

					//Switch active layer if the object selected is under a non-active layer
					this.tree.select_node({id: parentId});

					this.events.trigger('objectSelected', node.id);
				}

			}

		});

		$('#layer-tree').on('move_node.jstree', (node, parent, position) => {
			console.log("Node Moved!");

			var rootNode = this.tree.get_node({id: '#' });

			this.events.trigger('layerMoved', rootNode.children)

		});


		$('#layer-tree').on('redraw.jstree', (event, data) => {
			this.resetNodeState(data.nodes);
		});

		document.getElementById('btn-add-layer').addEventListener('click', (event) => {
			this.addLayer();
		});

		document.getElementById('btn-remove-layer').addEventListener('click', (event) => {
			this.removeSelected();
		});

	}

	resetNodeState(nodes){
		if (!nodes) { return; }

		nodes.forEach((id) => {
			var node = this.tree.get_node({id: id});

			if (node.data.type == 'layer'){

				var hideBtn = document.getElementById(id).getElementsByClassName('layerbtn-visible')[0];

				if (this.nodeState[id].hidden){
					hideBtn.style.backgroundImage = 'url()';
				}
					
				hideBtn.addEventListener('click', (event) =>{
					if (this.nodeState[id].hidden){

						hideBtn.style.backgroundImage = 'url(resources/icon/icon-eye.png)';

						this.nodeState[id].hidden = false;

						this.events.trigger('layerUnhidden', id);
						
					} else {

						hideBtn.style.backgroundImage = 'url()';

						this.nodeState[id].hidden = true;

						this.events.trigger('layerHidden', id);
					}


				});

			}
		});
	}

	getLayerId(){
		return 'layer-' + this.layerIdIndex++;
	}

	addLayer(){

		var layerId = this.getLayerId();
		var btnId = layerId+'-toggle-hidden';
		var layerNode = {
							id: layerId,
							text: layerId + '<button class="layerbtn-visible" id="'+ btnId +'"></button>',
							icon: 'resources/icon/icon-layer.png',
							data: {
									type: 'layer',
									hidden: false,
								}
						}

		this.nodeState[layerId] = { hidden: false };

		this.tree.create_node('#', layerNode, 'first', () => {

			this.events.trigger('layerAdded', layerId);

			this.tree.select_node({ id: layerId });

		});	

		return layerId;
	}

	isLayerNode(id){
		var node = this.tree.get_node({ id: id });
		if (node.data.type == 'layer'){
			return true;
		}
		return false;
	}

	isObjectNode(id){
		var node = this.tree.get_node({ id: id });
		if (node.data.type == 'object'){
			return true;
		}
		return false;
	}

	getParentId(id){
		return this.tree.get_node({ id: id }).parent;
	}

	getActiveLayer(){
		return this.tree.get_node({ id: this.activeLayerId });
	}

	addObject(wrapper){

		var objectNode = {
							id: wrapper.id,
							text: wrapper.name,
							icon: 'resources/icon/icon-object.png',
							data: {
									type: 'object',
									}
						}

		this.tree.create_node( this.getActiveLayer(), objectNode, 'last', () => {

			this.events.trigger('objectAdded', wrapper.id);
			this.tree.redraw(true);

		});	
		
	}

	addObjects(wrappers){
		wrappers.forEach((wrapper) => {
			this.addObject(wrapper);
		});
	}

	removeObject(wrapper){
		this.tree.delete_node({id: wrapper.id});
	}

	removeObjects(wrappers){
		wrappers.forEach((wrapper) => {
			this.tree.delete_node({id: wrapper.id});
		});
	}

	removeSelected(){
		if (this.numOfLayers() === 1){ return; }

		var toRemoveId = this.tree.get_selected()[0];
		var node = this.tree.get_node({id: toRemoveId});

		if (node.data.type == 'layer'){

			this.events.trigger('layerDeleted', toRemoveId);

			this.tree.delete_node(node);

			this.defaultActiveLayer();

		} 
	}

	numOfLayers(){
		var rootNode = this.tree.get_node({id: '#' });
		return rootNode.children.length;
	}

	defaultActiveLayer(){
		var rootNode = this.tree.get_node({id: '#' });
		this.tree.select_node({ id: rootNode.children[0] });
	}

}

module.exports = LayerView;