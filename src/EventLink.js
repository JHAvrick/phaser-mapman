var EventLink = {

	preload(){ 

		MapMan.events = new EventManager();
		//MapMan.Objects = new ObjectMaster(this.game);
		MapMan.ObjectPool = new ObjectPool(this.game);
		MapMan.ObjectFactory = new ObjectFactory(this.game);

		MapMan.Stages = new StageMaster(this.game);
		MapMan.Assets = new AssetMaster(this.game);
		MapMan.Definitions = new DefinitionMaster(this.game);
		MapMan.Tools = new ToolBox(this.game);
		MapMan.globalReset = function(){

			//this.Objects.reset();
			//this.Stages.reset();
			//this.Assets.reset();
			//this.Tools.reset();

			this.events.trigger('globalReset');

		}
	},

	render(){
		//var pos = MapMan.Tools.Zoom.adjustedPosition(this.game.input.mousePointer.worldX, this.game.input.mousePointer.worldY);
		//this.game.debug.text('X: ' + pos.x + ' Y: ' + pos.y, 32, 32);
	},

	create: function(){
		MapMan.Stages.newStage('default');
		MapMan.Stages.setActiveStage('default');

		//Editor Components
		this.projectManager = new ProjectManager(this.game);
		this.stageManager = new StageManager(this.game);

		//UI Components
		this.layerView = new LayerView();
		this.assetView = new AssetView(document.getElementById('freewall'), this.fileAccess);
		this.propertyView = new PropertyView(this.game);
		this.toolbarView = new ToolbarView();

		//Event Links
		this.addMapManEvents();
		this.addLayerEvents();
		this.addSelectionEvents();
		this.addAssetViewEvents();
		this.addToolbarEvents();
		this.addMenuBarEvents();
		this.addKeyMapEvents();

	},

	addMapManEvents: function(){

		MapMan.events.on('globalReset', () => {

			//TO DO

		});

	},

	addLayerEvents: function(){

		this.layerView.events.on('objectSelected', (id) => {
			console.log("Object Selected: " + id);
		});

		this.layerView.events.on('layerAdded', (id) => {
			
			MapMan.Stages.active.newLayer(id);
			MapMan.Stages.active.setActiveLayer(id);

		});

		this.layerView.events.on('layerSwitched', (id) => {
			console.log("Active Layer Switched: " + id);

			MapMan.Stages.setActiveLayer(id);

		});

		this.layerView.events.on('layerHidden', (id) => {
			console.log("Layer Hidden: " + id);
		});

		this.layerView.events.on('layerUnhidden', (id) => {
			console.log("Layer Unhidden: " + id);
		});

	},

	addSelectionEvents: function(){

		MapMan.Tools.Select.events.on('selectionChanged', (wrapper) => {

			var selection = MapMan.Tools.Select.getSelection();

			if (selection){
				this.propertyView.clear();
				this.propertyView.addAll(wrapper.getTracked());
			}

		});

		MapMan.Tools.Select.events.on('selectionEdited', (wrapper) => {

			if (wrapper){

				this.propertyView.setAll(wrapper.getTracked());

			}

		});

		MapMan.Tools.Select.events.on('unselect', () => {
			this.propertyView.clear();
		});

	},

	addAssetViewEvents: function(){

		this.propertyView.events.on('propertyAdded', (name) => {

			var selection = MapMan.Tools.Select.getSelection();

			if (selection){

				var propData = selection.trackProperty(name);	//May be returned as an array if the property entered is actually a spread of multiple properties

				if (propData){
					if (propData instanceof Array){

						propData.forEach((prop) => {
							this.propertyView.add(prop.name, prop.meta, prop.value);
						});

					} else {

						this.propertyView.add(propData.name, propData.meta, propData.value);

					}
		
				}

			}

		});

		this.propertyView.events.on('propertyEdited', (name, value) => {

			var selection = MapMan.Tools.Select.getSelection();

			if (selection){
				selection.toDisplay(name, value);
			}
				
		});

		this.propertyView.events.on('propertyRemoved', (name) => {

			var selection = MapMan.Tools.Select.getSelection();

			if (selection){
				selection.untrack(name);
			}

		});

		/* 
		 * EVENT: Image dropped onto canvas from AssetView
		 * RESPONSE: Image is loaded if not already in cache, new Wrapper object is created
		 */
		this.assetView.events.on('assetDropped', (position, data) => {

			if (data){

				MapMan.Assets.load(data.path, (imageKey) => {

					var newObj = MapMan.ObjectFactory.create( MapMan.Definitions.getActive(), imageKey );
								 MapMan.ObjectPool.add(newObj);
								 MapMan.Stages.active.add(newObj);

					var x = this.game.input.mousePointer.worldX;
					var y = this.game.input.mousePointer.worldY;

					this.stageManager.addToStage(x, y, newObj);
					this.layerView.addObject(newObj);

				});

			}

		});

		/* 
		 * EVENT: A project.json file is found in the drag-and-dropped directory
		 * RESPONSE: Load the project settings
		 */
		this.assetView.events.on('projectDropped', (rootDir) => {

			this.projectManager.loadProject(rootDir);

			//TO DO: More stuff?

		});

	},

	addToolbarEvents: function(){

		/* 
		 * EVENT: Grid tool button is pressed
		 * RESPONSE: Draw or undraw grid and make objects snap to gridlines
		 */
		this.toolbarView.events.on('gridToggled', function(){
			MapMan.Tools.Grid.toggleGrid();
		}.bind(this));

		/* 
		 * EVENT: Return-to-origin button is clicked
		 * RESPONSE: Move the camera back to the origin
		 */
		this.toolbarView.events.on('goToOrigin', function(){
			MapMan.Tools.Zoom.resetZoom();
			this.game.camera.setPosition(0,0);
		}.bind(this));

		/* 
		 * EVENT: Scale Tool button is pressed
		 * RESPONSE: Activate the scale tool
		 */
		this.toolbarView.events.on('scaleToggled', function(){
			MapMan.Tools.Select.setActiveTool(MapMan.Tools.Select.Scale);
		}.bind(this));

	},

	addMenuBarEvents: function(){

		var File = {

					newProject: document.getElementById('file-new'),
					openProject: document.getElementById('file-open'),
					save: document.getElementById('file-save'),
					saveAs: document.getElementById('file-saveAs'),
					publish: document.getElementById('file-publish'),

					}

		var Edit = {

					undo: document.getElementById('edit-undo'),
					copy: document.getElementById('edit-copy'),
					paste: document.getElementById('edit-paste'),
					duplicate: document.getElementById('edit-duplicate'),

					}


		/* 
		 * EVENT: "New Project" is clicked from menu bar
		 * RESPONSE: Create a new project directory and open the new project
		 */
		File.newProject.addEventListener('click', (event) => {

			this.projectManager.newProject( path => {
				if (path){

					this.assetView.reset();
					this.assetView.createRoot(path);
					this.projectManager.loadProject(path);


				} else {

					console.log("Something has gone terribly wrong...");

				}

			});

		});

		/* 
		 * EVENT: "Open Project" is clicked from menu bar
		 * RESPONSE: Prompts user to select project directory and then loads the project
		 */
		File.openProject.addEventListener('click', (event) => {	

			this.projectManager.openProject((rootDir) => {

				this.assetView.reset();
				this.assetView.createRoot(rootDir);
				this.projectManager.loadProject(rootDir);

			});
			
		});



	},

	addKeyMapEvents: function() {

/*  --------------------------------------------------------------------------------------------------
	|                                             DEV SHORTCUTS                                      |
	--------------------------------------------------------------------------------------------------	*/	

		//RELOAD
		Mousetrap.bind(['ctrl+r'], function(e) {
			remote.getCurrentWindow().reload();
		}.bind(this));

		//OPEN DEV TOOLS
		Mousetrap.bind(['ctrl+shift+i'], function(e) {
			remote.getCurrentWindow().openDevTools();
		}.bind(this));

		//
		this.testId = 0;
		Mousetrap.bind(['ctrl+q'], function(e) {
			this.layerView.addObject('testId'+this.testId++);
		}.bind(this));



/*  --------------------------------------------------------------------------------------------------
	|                                             MENU SHORTCUTS                                     |
	--------------------------------------------------------------------------------------------------	*/		

		//DELETE CURRENT SELECTION
		Mousetrap.bind(['del'], function(e) {

			var wrapper = MapMan.Tools.Select.getSelection();
			var wrapperGroup = MapMan.Tools.Select.getGroupSelection();

			if (wrapper){

				wrapper.delete();

				//Register action so it can be undone
				MapMan.Stages.action({
					type: 'Delete Object',
					undo: () => {
						wrapper.undelete();
						this.layerView.addObject(wrapper);
					}
				});

				this.layerView.removeObject(wrapper);

			} else if (wrapperGroup) {

				wrapperGroup.forEach((wrapper) => {
					wrapper.delete();
				});

				MapMan.Stages.action({
					type: 'Delete Group',
					undo: () => {
						wrapperGroup.forEach((wrapper) => {
							wrapper.undelete();
						});

						this.layerView.addObjects(wrapperGroup);

					}
				});

				this.layerView.removeObjects(wrapperGroup);
			}

			MapMan.Tools.Select.unselect();

		}.bind(this));

		//
		Mousetrap.bind(['ctrl+z'], function(e) {
			MapMan.Stages.undo();
		}.bind(this));



/*  --------------------------------------------------------------------------------------------------
	|                                             NAV SHORTCUTS                                      |
	--------------------------------------------------------------------------------------------------	*/	

		//DIRECTIONAL CONTROLS
		Mousetrap.bind(['up'], function(e) {

			this.game.camera.y -= MapMan.Tools.Grid.gridY * MapMan.Tools.Zoom.scaleFactor;

		}.bind(this));

		Mousetrap.bind(['down'], function(e) {

			this.game.camera.y -= -1 * MapMan.Tools.Grid.gridY * MapMan.Tools.Zoom.scaleFactor;

		}.bind(this));

		Mousetrap.bind(['left'], function(e) {

			this.game.camera.x -= MapMan.Tools.Grid.gridX * MapMan.Tools.Zoom.scaleFactor;

		}.bind(this));

		Mousetrap.bind(['right'], function(e) {

			this.game.camera.x -= -1 * MapMan.Tools.Grid.gridX * MapMan.Tools.Zoom.scaleFactor;

		}.bind(this));


		//RETURN TO ORIGIN
		Mousetrap.bind(['ctrl+o'], function(e) {

			MapMan.Tools.Zoom.resetZoom();

		}.bind(this));

	}




}
