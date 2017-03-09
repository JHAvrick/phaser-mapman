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
							console.log(err);
						}
					},
			"plugins": ["wholerow"]
		});
		this.tree = $.jstree.reference('#layer-tree');

		this.layerIdIndex = 0;

		this.addEvents();
		this.activeLayerId = this.addLayer();

	}

	addEvents(){

		$('#layer-tree').on('select_node.jstree', (event, nodeData) => {
			var node = nodeData.node;

			if (node.data.type == 'layer' && node.id !== this.activeLayerId){
				this.activeLayerId = node.id;

				this.events.trigger('layerSwitched', this.activeLayerId);

			} else if (node.data.type == 'object') {

				this.events.trigger('objectSelected', node.id);

			}

		});

		$('#layer-tree').on('redraw.jstree', (event, data) => {
			console.log("Node Redraw!");
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

			this.refreshButtons();

		});	

		return layerId;
	}

	//Since jsTree doesn't support buttons natively I'm forced to use this hackish solution
	refreshButtons(){

		/*
		var hideBtns = document.getElementsByClassName('layerbtn-visible');
		for (var i = 0; i < hideBtns.length; i++){
			hideBtns[i].addEventListener('click', function (event){
				this.style.backgroundImage = 'url()';
				console.log(this.parentNode.parentNode.id);
			});	
		}
		*/



	}

	_addHideLayerEvent(btnId, layerId){


		var toggleVisible = document.getElementById(btnId);

			toggleVisible.addEventListener('click', (event) => {


				var layerId = layerId;

				var layerData = this.tree.get_node({id: layerId})

				if (layerData.hidden){
					console.log("Layer Unhidden: " + layerId);

					toggleVisible.style.backgroundImage = 'url("resources/icon/icon-eye.png")';

					layerData.hidden = false;
					this.events.trigger('layerUnhidden', layerId);
				} else {
					console.log("Layer Hidden: " + layerId);

					toggleVisible.style.backgroundImage = 'url()';

					layerData.hidden = true;
					this.events.trigger('layerUnhidden', layerId);
				}
			});

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

		console.log("Delete All!");
		console.log(wrappers);

		wrappers.forEach((wrapper) => {
			this.tree.delete_node({id: wrapper.id});
		});
	}

	removeSelected(){

		var toRemoveId = this.tree.get_selected()[0];
		var node = this.tree.get_node({id: toRemoveId});

		if (node.data.type == 'layer'){

			this.events.trigger('layerDeleted', toRemoveId);

		} else if (node.data.type == 'object'){

			this.events.trigger('objectDeleted', toRemoveId)

		}

		this.tree.delete_node(node);
	}


}

module.exports = LayerView;