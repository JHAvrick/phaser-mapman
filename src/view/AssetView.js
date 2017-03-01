//BUGS:

	// Identical filenames in different directories causes issues

class AssetView {

	constructor(container){
		this.events = new CallbackManager();
		this.root = undefined;
		this.workingDirectory = undefined;
		this.divIds = {};	//holds the div ids for the items in the current working directory
		this.blockData = {};	//opposite of divIds, holds data for each block, lookup by div id
		this.divIndex = 0;	//incremented for unique div ids
		this.selection = undefined;
		this.wallDiv = document.getElementById('assetview-wall');
		this.container = document.getElementById('assetview-container');
		this.wall = new Freewall(this.wallDiv);

		this.init();
	}

	init(){
		//Wall config
		var self = this;
		this.wall.reset({
			selector: '.item',
			cellW: 100,
			cellH: 100,
			gutterX: 2,
			gutterY: 2,
			onResize: function() {
				self.wall.refresh();
			}
		});
		this.wall.fitWidth();

		//Wall drop
		this.container.addEventListener('drop', function(event){
			event.preventDefault();

			if (!this.root){

				document.getElementById('wall-wrap').style.backgroundImage = 'none';
				this.setWorkingDirectory(event.dataTransfer.files[0].path);

			}

		}.bind(this));

		//Canvas drop event
		$(".droppable").droppable({
			refreshPositions: true,
			drop: function(event, ui) {
				if (this.id = 'mapman-canvas'){

					console.log()

					var x = event.clientX - $(this).position().left;
					var y = event.clientY - $(this).position().top;
					var position = {x: x, y: y};
					var data = self.getBlockByDivId(ui.draggable.attr("id"));

					self.events.trigger('assetDropped', position, data);
				}
			},
			over: function(event, ui) {
				//$('.display').html( this.id );
			}
		});

		$('#mapman-canvas').mouseover(function(){

			var interval = setInterval(function() {
		        document.getElementById('mapman-canvas').focus();
			}, 1);
		});

		$('#mapman-canvas').hover(function(){
			document.getElementById('mapman-canvas').focus();
		});

	}


	getBlockByDivId(id){
		return this.blockData[id];
	}

	//block key is the corresponding file name
	getDivByBlockKey(filename){
		return this.divIds[filename];
	}

	clearBlocks(){
		this.blockData = {};
		this.divIds = {};

		while (this.wallDiv.firstChild) {
			this.wallDiv.removeChild(this.wallDiv.firstChild);
		}
	}

	addReturnBlock(returnPath){

		//Ensure that there is no return path leading outside the root
		if (returnPath !== this.getParentDirectory(this.root)){

			var div = document.createElement('div');
				div.className = 'item';	
				div.style.backgroundImage = 'url("resources/icon/icon-return.png")';

				div.addEventListener('click', function(){
				
					this.clearBlocks();
					this.addReturnBlock(this.getParentDirectory(returnPath));
					this.setWorkingDirectory(returnPath);

				}.bind(this));

				this.wall.appendBlock(div);

		}
	}

	addBlock(labelText, labelClass, imagePath, clickCallback){
		var div = document.createElement('div');
			div.className = 'item';
			div.style.backgroundImage = 'url(' + imagePath + ')';
			div.appendChild(this.getLabel(labelText, labelClass));
			div.addEventListener('click', clickCallback.bind(this));
			div.addEventListener('dragstart', function(e){
				e.preventDefault();

				console.log("Drag Start!");
			})

			this.wall.appendBlock(div);

			var id = div.id = ('block-div-' + this.divIndex++);

			return id;
	}

	getLabel(text, className){
		var label = document.createElement('label');
			label.className = className;
			label.innerHTML = text;

		return label;
	}

	addAssetBlock(url){

		var fileType = url.substr(url.lastIndexOf('.') + 1);
		var blockId;

		if (["gif", "jpeg", "jpg", "png"].includes(fileType)){

			blockId = this.addBlock(this.getFileName(url), 'asset-label', url.replace(/ /g, '%20'), function(){

				this.select(this.getFileName(url, true));

				this.events.trigger('assetBlockSelected', url, fileType);;

			});

			
			//Make image assets draggable
			$('#' + blockId).draggable({	opacity: 0.7, 
											helper: "clone", 
											appendTo: "body",
											start: function(e, ui) {
												//Add a class to the helper so that CSS can be used to style it
												//Its important that the helper ignores pointer events so that
												//the canvas knows where the pointer is
												$(ui.helper).addClass("ui-draggable-helper");
											}
										});
			

			return blockId;

		} else {

			return this.addBlock(this.getFileName(url), 'asset-label', 'resources/icon/icon-text-large.png', function(){

				this.select(this.getFileName(url, true));

				this.events.trigger('assetBlockSelected', url, fileType);;

			});

		}

	}

	addDirBlock(dirPath){
		return this.addBlock(this.getFileName(dirPath), 'dir-label', 'resources/icon/icon-dir.png', function(){

			$('#tree').jstree('activate_node', this.getFileName(dirPath, true));

			this.events.trigger('dirBlockSelect', dirPath);

		});
	}

	select(fileName){
		this.selectBlock(fileName);
		this.selectNode(fileName);
	}

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

	setWorkingDirectory(dirPath, toSelect){
		this.clearBlocks();

		var self = this;
		fs.readdir(dirPath, (err, files) => {
			if (files){
				files.forEach(file => {
					var subPath = path.join(dirPath, file);

					fs.lstat(subPath, (err, stats) => {

						if (stats.isDirectory()){

							self.addDirBlock(subPath);

						} else {

							var divId = self.addAssetBlock(subPath);

							if (divId){
								var fileName = self.getFileName(subPath, true);

								self.divIds[fileName] = divId;	//use fileName as lookup key
								self.blockData[divId] = {path: subPath, name: fileName} //use divId as lookup key

								//If a selection is specified, select the block if/when its fileName appears 
								if (fileName == toSelect){
									self.selectBlock(fileName);
								}

							}
							
						}

					});

				});

				//Set and root and build tree down from there 
				if (!self.root) { 
					self.root = dirPath; 
					self.buildTree(dirPath);
				}	

				self.workingDirectory = dirPath;

				self.wall.refresh();
			}
		});

	}

	buildTree(dirPath){

		var self = this;
		$('#tree').jstree({ 'plugins': ["wholerow", "sort", "search"] ,'core' : {
		    'data' : [dirTree(dirPath, null, function(item, itemPath){
		    	
		    	//If there is no extension, its probably a directory
		    	if (item.extension) {
		    		item.icon = self.getExtensionIcon(item.extension);
		    	} 

			    item.text = item.name;
			    item.id = item.name;
			    item.data = {
			    	name: item.name,
			    	extension: item.extension,
			    	path: item.path
			    }

		    })]
		}});

		$('#tree').on('activate_node.jstree', function (e, activated) {
			var item = activated.node.data;

			if (item.extension){

				var parentDirectory = self.getParentDirectory(item.path);

				if (parentDirectory !== self.workingDirectory){

					self.setWorkingDirectory(parentDirectory, item.name);

				} else {

					self.selectBlock(item.name);

				}

				self.events.trigger('assetNodeSelected', item);

			} else {
				
				//self.addReturnBlock(self.getParentDirectory(item.path));
				self.setWorkingDirectory(item.path);

				self.events.trigger('dirNodeSelected', item);
			}


		}).jstree();
	}

	getExtensionIcon(extension){
		console.log(extension);
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

	getParentDirectory(dir){
		var split = dir.split(path.sep);

		return dir.slice(0, dir.length - split[split.length - 1].length - 1);
	}

	getFileName(filePath, keepExtension){
		var split = filePath.split(path.sep);

		if (keepExtension){
			return split[split.length - 1];
		}

		return split[split.length - 1].split('.')[0];
	}


}
