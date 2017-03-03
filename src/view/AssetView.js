const EventManager = require('./src/lib/event-manager.js');
const FileAccess = require('./src/lib/file-access.js');
const Freewall = require('freewall').Freewall;

class AssetView {

	constructor(container){

		//DOM
		this.wallDiv = document.getElementById('assetview-wall');
		this.container = document.getElementById('assetview-container');

		//LIB
		this.events = new EventManager();
		this.fileAccess = new FileAccess();
		this.wall = new Freewall(this.wallDiv);

		$('#tree').jstree({ 
			"core": { check_callback: true },
			"plugins": ["wholerow", "sort", "search"]
		});
		this.tree = $.jstree.reference('#tree');

		//Class Members
		this.root = undefined;	//Reference to root path
		this.workingDirectory = undefined;	//Currently active directory
		this.workingDirectoryNode = undefined;
		this.activeBlock = undefined;
		this.activeNode = undefined;

		this.divIds = {};	//holds the div ids for the items in the current working directory
		this.blockData = {};	//opposite of divIds, holds data for each block, lookup by div id
		this.divIndex = 0;	//incremented for unique div ids
		this.selection = undefined;
		this.nodeId = 0;	//Index for unique node ID 
		
		//Events an config
		this.init();
		this.addEvents();
	}

	tree(method, param){

	}

	init(){
		//Wall config
		this.wall.reset({
			selector: '.item',
			cellW: 100,
			cellH: 100,
			gutterX: 2,
			gutterY: 2,
			onResize: () => { this.wall.refresh(); }
		});

		this.wall.fitWidth();
	}

	addEvents(){
		var self = this;

		this.container.addEventListener('drop', (event) => {
			event.preventDefault();

			var path = event.dataTransfer.files[0].path;

			if (path){
				document.getElementById('wall-wrap').style.backgroundImage = 'none';
				this.loadDirTree(path);
			}

		});


		$('#tree').on('select_node.jstree', (event, nodeData) => {

			if (nodeData.node !== this.activeNode){
				var node = nodeData.node;

				if (node.data.type == 'dir'){

					this.tree.open_node(node);
					this.setWorkingDirectory(node);

				} else {
					
					this.select(node);

				}
			}
		});

		//Canvas drop event
		$(".droppable").droppable({
			refreshPositions: true,
			drop: function(event, ui) {
				if (this.id = 'mapman-canvas'){

					var x = event.clientX - $(this).position().left;
					var y = event.clientY - $(this).position().top;
					var position = {x: x, y: y};
					var data = $(ui.draggable[0]).data('nodeData');

					self.events.trigger('assetDropped', position, data);
				}
			}
		});

	}



	select(node){
		this.activeNode = node;	//Prevents event loop

		//Nagivate to the correct directory if the selected file is outside of the active directory
		var parentNode = this.tree.get_node({id: this.tree.get_node(node).parent });
		if (this.workingDirectoryNode !== parentNode){
			this.setWorkingDirectory(parentNode);
		}

		this.tree.deselect_all();
		this.tree.select_node(node);

		if (this.activeBlock){
			this.activeBlock.style.border = '1px solid black';
		}

		this.activeBlock = node.data.div;
		this.activeBlock.style.border = '4px solid lightgreen';
	}

	/*
	selectBlock(fileName){

		if (this.selection){
			this.selection.style.border = '0px';
		}

		this.selection = document.getElementById(this.divIds[fileName]);

		if (this.selection){
			this.selection.style.border = "1px solid black";
		}
	}

	selectNode(fileName){
		$('#tree').jstree('deselect_all');
		$('#tree').jstree('select_node', fileName);
		$('#tree').jstree('toggle_node', fileName);
	}
	*/

//-------------------------------------------------------------------------------------

	createRoot(dirPath){
		this.root = dirPath;

		var item = this.fileAccess.pathInfo(dirPath);
		var id = this.getId();
		var node = 	{
					id: id,
					text: item.name,
					icon: this.getExtensionIcon(item.ext),
					data:   {	
								id: id,
								name: item.name,
								type: 'dir',
								path: dirPath,
								ext: item.ext, 
							}

					}

		this.tree.create_node( '#', node, "last", () => {
				this.loadDirTree(dirPath, node);
		});

	}

	loadDirTree(dirPath, parentNode){
		if (!this.root){ 
			this.createRoot(dirPath);
			return;
		}

		this.fileAccess.getDirFiles(dirPath, (item, itemPath) => {

			var id = this.getId();
			var node = 	{
						id: id,
						text: item.name,
						icon: this.getExtensionIcon(item.ext),
						data:   {	
									id: id,
									name: item.name,
									type: item.type,
									path: itemPath,
									ext: item.ext, 
								}

						}

			this.tree.create_node( parentNode, node, "last", () => {
				if (item.type == 'dir'){
					this.loadDirTree(itemPath, node);
				}
			});

		});
	}

	setWorkingDirectory(node){
		this.workingDirectoryNode = node;
		this.workingDirectory = node.data.path;

		this.clearBlocks();	

		var childIds = this.tree.get_node(node).children;
			childIds.forEach((id) => {
				var node = this.tree.get_node({id: id});

				node.data.div = this.addBlock(node);

			});

		this.wall.refresh();
	}

	addBlock(node){
		var div = document.createElement('div');
			div.className = 'item';
			$(div).data('nodeData', node.data);

			if (node.data.type == 'dir'){

				div.style.backgroundImage = 'url("resources/icon/icon-dir.png")';
				div.appendChild(this.getLabel(node.data.name, 'dir-label'));
				div.addEventListener('click', (event) => {
					this.events.trigger('dirBlockSelected', node);
					this.tree.select_node(node);
				});

			} else {

				div.style.backgroundImage = 'url(' + node.data.path.replace(/ /g, '%20'); + ')';
				div.appendChild(this.getLabel(node.data.name, 'asset-label'));
				div.addEventListener('click', (event) => {
					this.events.trigger('assetBlockSelected', node);
					this.tree.select_node(node)
				});

				if ([".gif", ".jpeg", ".jpg", ".png"].includes(node.data.ext)){

					$(div).draggable({	
										opacity: 0.7, 
										helper: "clone", 
										appendTo: "body",
										start: function(e, ui) {
												//Add a class to the helper so that CSS can be used to style it
												//Its important that the helper ignores pointer events so that
												//the canvas knows where the pointer is
												$(ui.helper).addClass("ui-draggable-helper");
											}
										});

				}

			}

			this.wall.appendBlock(div);

			return div;
	}


	getExtensionIcon(extension){
    	if (extension) {
    		switch (true){
	    		case ['.png', '.jpg', 'gif'].includes(extension):
	    				var icon = 'resources/icon/icon-image.png';
	    			break;
	    		case ['.mp3', '.mpeg3', 'mp4', '.ogg', '.webm', '.flac'].includes(extension):
	    				var icon = 'resources/icon/icon-audio.png';
	    			break;
	    		case ['.txt', '.js', 'css', '.html'].includes(extension):
	    				var icon = 'resources/icon/icon-text.png';
	    			break;
	    		case ['.json'].includes(extension):
	    				var icon = 'resources/icon/icon-json.png';
	    			break;
	    		case true:
	    				var icon = 'resources/icon/icon-unknown.png';
	    			break;

	    	}
    	}

    	return icon;
	}

	clearBlocks(){
		this.blockData = {};
		this.divIds = {};

		while (this.wallDiv.firstChild) {
			this.wallDiv.removeChild(this.wallDiv.firstChild);
		}
	}

	getLabel(text, className){
		var label = document.createElement('label');
			label.className = className;
			label.innerHTML = text;

		return label;
	}

	getId(){
		return 'nodeID-' + this.nodeId++;
	}

}
