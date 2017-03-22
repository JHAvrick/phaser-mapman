const EventManager = require('../lib/event-manager.js');
const FileAccess = require('../lib/file-access.js');
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
			"core": { 	check_callback: true,
						data: [],
						multiple: false,
						error: function(err){
							console.log(err);
						}
					},
			"plugins": ["wholerow", "sort", "search"]
		});
		this.tree = $.jstree.reference('#tree');

		//Class Members
		this.root = undefined;	//Reference to root path
		this.rootNode = undefined;

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

		this.container.addEventListener('drop', (event) => {
			event.preventDefault();

			if (event.dataTransfer.files.length > 0){
				var path = event.dataTransfer.files[0].path;

				if (path){
					if (!this.root){

						this.events.trigger('projectDropped', path);

						this.createRoot(path);

					} else {

						this.copyToWorkingDirectory(path);

					}
					
				}
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

		document.getElementById('mapman-canvas').addEventListener('drop', e => {
			e.preventDefault();

			var node = this.tree.get_node({ id: e.dataTransfer.getData('text') });

			this.events.trigger('assetDropped', node.data, e.clientX, e.clientY);

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

	reload(){
		/*
		this.tree.delete_node(this.rootNode);
		this.clearBlocks();

		var resetRoot = this.root;
		this.root = null;

		this.loadDirTree(resetRoot);
		this.setWorkingDirectory(this.workingDirectoryNode);
		*/
	}

	reset(){
		this.tree.delete_node(this.rootNode);
		this.clearBlocks();
		this.root = null;
	}

	//Checks the working directory for a node with the given filename
	checkFilenameExists(fileName){

		var nodeIds = this.tree.get_node(this.workingDirectoryNode).children;	

		for (let i = 0; i < nodeIds.length; i++){

			var child = this.tree.get_node({id: nodeIds[i] });

			if ( (child.data.name + child.data.ext) === fileName){
				return child;
			}

		}

	}

	removeNodeByFilename(fileName){ 
		var node = this.checkFilenameExists(fileName);

		if (node){
			node.data.div.remove();
			this.tree.delete_node(node);
			this.wall.refresh();;
		}
	}

	copyToWorkingDirectory(filePath){

		this.fileAccess.copy(filePath, this.workingDirectory).then((copiedPath) => {

			this.appendNode(copiedPath, this.workingDirectoryNode);

		});

	}

	//Almost identical to loadDirTree except that each file is read individually rather than all files a directory
	appendNode(itemPath, parentNode){

		//If a file/node exists with the same name, remove it (as it has now been overwritted)
		//This must be done before the new node is created
		this.removeNodeByFilename(this.fileAccess.getFileName(itemPath));

		this.fileAccess.pathInfo(itemPath, (item) => {

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

			this.tree.create_node( parentNode , node, "last", () => {

				var newNode = this.tree.get_node(node);
					newNode.data.div = this.addBlock(newNode);

				if (item.type === 'dir'){
					this.loadDirTree(itemPath, newNode);
				}

			});

		});

	}

	//Appends a directory node and recursively adds all child nodes  
	loadDirTree(dirPath, parentNode){

		this.fileAccess.getDirFiles(dirPath, (item, itemPath) => {

			//Don't create a node for project file
			if ( (item.name + item.ext ) === 'project.json'){ return; }

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

	createRoot(dirPath){

		this.fileAccess.pathInfo(dirPath, (item) => {

			if (item.type == 'dir'){
				this.root = dirPath;

				var item = this.fileAccess.parsePath(dirPath);
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
						this.rootNode = node;
						this.loadDirTree(dirPath, node);
				});

				this.hideDragHint();
			}

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

				//This monstrosity removes spaces and appends data/time to the image url to prevent caching
				var imagePath = node.data.path.replace(/ /g, '%20') + ('?' + new Date().getTime()); 

				div.style.backgroundImage = 'url(' + imagePath + ')';
				div.appendChild(this.getLabel(node.data.name, 'asset-label'));
				div.addEventListener('click', (event) => {
					this.events.trigger('assetBlockSelected', node);
					this.tree.select_node(node)
				});

				if ([".gif", ".jpeg", ".jpg", ".png", ".json"].includes(node.data.ext)){

					div.draggable = true;
					div.addEventListener('dragstart', e => {
						e.dataTransfer.setData("text/plain", node.id);
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

	hideDragHint(){
		document.getElementById('wall-wrap').style.backgroundImage = 'none';
	}

}

module.exports = AssetView;