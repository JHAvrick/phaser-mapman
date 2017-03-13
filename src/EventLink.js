var EventLink = {

	init(){

		MapMan.events = new EventManager();
		MapMan.ObjectPool = new ObjectPool(Game);
		MapMan.ObjectFactory = new ObjectFactory(Game);
		MapMan.Stages = new StageMaster(Game);
		MapMan.Assets = new AssetManager(Game);
		MapMan.Tools = new ToolBox(Game);
		MapMan.Definitions = new DefinitionMaster(Game);
		MapMan.Settings = {

			settingsMap: {
					backgroundColor: (color) => { Game.stage.backgroundColor = color; },
					gridSize: (size) => { 
						MapMan.Tools.Grid.setSize(size);
						MapMan.Tools.Select.Scale.setHandleSnapSize(size); 
					},
					gridColor: (hexString) => { MapMan.Tools.Grid.setColor(parseInt(hexString.replace('#', '0x', 16))); },
					frameWidth: (width) => {}, //TBD
					frameHeight: (height) => {} //TBD
			},

			set: function(settings){
				for (var key in settings){
					if (settings[key] !== undefined){
						this.settingsMap[key](settings[key]);
					}
				}
			}

		}

		MapMan.globalReset = function(){
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
		this.paramView = new ParamView();
		this.tabView = new TabView('property-tabs');

		//Event Links
		this.addForms();
		this.addTabEvents();
		this.addMapManEvents();
		this.addLayerEvents();
		this.addObjectTabEvents();
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

	addForms(){

		//Object info in Object tab
		this.objectForm = new FormView([{
											name: 'name',
											id: 'object-name',
											refresh: (wrapper) => { return wrapper.name; },
											onChange: (value) => {
												var wrapper = MapMan.Tools.Select.getSelection();

												if (wrapper){
													wrapper.setName(value);
												}

											}
										},
										{
											name: 'type',
											id: 'object-type',
											refresh: (wrapper) => { return wrapper.definition.name }
										},
										{
											name: 'textureKey',
											id: 'texture-key',
											refresh: (wrapper) => { return wrapper.display.key }
										},
										{
											name: 'texturePreview',
											id: 'texture-preview',
											assign: 'style.backgroundImage',
											refresh: (wrapper) => { 
												return 'url("' + MapMan.Assets.getImagePath(wrapper.display.key) +'")';
											}
										}
									]);


		this.preferenceForm = new FormView([{
												name: 'backgroundColor',
												id: 'editor-color-pref',
											},
											{
												name: 'gridSize',
												id: 'grid-size-pref',
											},
											{
												name: 'gridColor',
												id: 'grid-color-pref',
											},
											{
												name: 'frameWidth',
												id: 'frame-width-pref',
											},
											{
												name: 'frameHeight',
												id: 'frame-height-pref',
											}
										]);


	},

	//Almost every tab displays information related to the current selection
	//Instead of mass updating each tab every time an object-modifying event 
	//occurs (which can be costly, performance-wise), the TabView informs only 
	//the active tab that it should update its display.
	addTabEvents(){

		var worldTab = {
			selectionChanged: () => {},
			selectionEdited: () => {},
		};

		var objectTab = {

			refresh: (wrapper) => {
				this.paramView.clear();

				if (wrapper) {
					this.paramView.addAll(wrapper.getParams());
					this.objectForm.refresh(wrapper);
				}

			},

			selectionChanged: (wrapper) => {
				this.paramView.clear();
				this.paramView.addAll(wrapper.getParams());
				this.objectForm.refresh(wrapper);
			},
			selectionEdited: (wrapper) => {
				this.paramView.setAll(wrapper.getParams());
			},
			unselect: () => {
				this.paramView.clear();
				this.objectForm.clear();
			}
		};
			
		var propertiesTab = {
			refresh: (wrapper) => {
				this.propertyView.clear();

				if (wrapper){
					this.propertyView.addAll(wrapper.getTracked());
				}
				
			},
			selectionChanged: (wrapper) => {
				this.propertyView.clear();
				this.propertyView.addAll(wrapper.getTracked());
			},
			selectionEdited: (wrapper) => {
				this.propertyView.setAll(wrapper.getTracked());
			},
			unselect: () => {
				this.propertyView.clear();
			}
		};

		this.tabView.addTab('world', worldTab);
		this.tabView.addTab('object', objectTab);
		this.tabView.addTab('properties', propertiesTab);
		this.tabView.setActive('world');

		this.tabView.events.on('tabSwitched', (activeTab) => {

			var wrapper = MapMan.Tools.Select.getSelection();

			this.tabView.triggerActive('refresh', wrapper);

		});

	},

	addObjectTabEvents(){

		this.paramView.events.on('parameterLinkToggled', (name) => {
			var wrapper = MapMan.Tools.Select.getSelection();

			if (wrapper){
				wrapper.toggleParamLink(name);

				this.paramView.clear();
				this.paramView.addAll(wrapper.getParams());
			}

		});

		this.paramView.events.on('parameterEdited', (name, value) => {
			var wrapper = MapMan.Tools.Select.getSelection();

			if (wrapper){
				wrapper.setParamValue(name, value);

				this.paramView.clear();
				this.paramView.addAll(wrapper.getParams());
			}

		});

	},

	addLayerEvents: function(){

		/* 
		 * EVENT: An object node is selected in the layer view
		 * RESPONSE: Id is fetched and used to select the object with the same array in the editor
		 */
		this.layerView.events.on('objectSelected', (id) => {
			MapMan.Tools.Select.unselect();
			MapMan.Tools.Select.select(MapMan.Stages.getWrapper(id));
		});

		/* 
		 * EVENT: A layer is added in the LayerView
		 * RESPONSE: MapMan.Stages points to the stage with the id passed from the event
		 * ALSO TRIGGERS: 'layerSwitched'
		 */
		this.layerView.events.on('layerAdded', (id) => {
			MapMan.Stages.active.newLayer(id);
		});

		/* 
		 * EVENT: Triggered when a layer other than the active one is selected
		 * RESPONSE: Active layer is changed
		 */
		this.layerView.events.on('layerSwitched', (id) => {
			MapMan.Tools.Select.unselect();
			MapMan.Stages.setActiveLayer(id);
		});

		/* 
		 * EVENT: The 'Delete Layer' button is pressed
		 * RESPONSE: Selected/Active layer and all objects within are deleted, this cannot be undone
		 * ALSO TRIGGERS: 'layerSwitched' (defaults to top layer in the stack)
		 */
		this.layerView.events.on('layerDeleted', (id) => {
			MapMan.Stages.deleteActiveLayer();
		});

		/* 
		 * EVENT: A layer is moved, triggered even if the layer is left in its original position
		 * RETURN: An array of layer ids in descending order
		 * RESPONSE: Each layer is brought to top, starting with the last element of the array and ending with the first
		 */
		this.layerView.events.on('layerMoved', (layerIds) => {
			MapMan.Stages.setLayerOrder(layerIds.reverse(), true);
		});

		/* 
		 * EVENT: Triggered when the 'visible' icon is toggled off in the layer view
		 * RESPONSE: All objects in the hidden layer are deactivated, but can still be selected via the layerview nodes
		 */
		this.layerView.events.on('layerHidden', (id) => {
			MapMan.Tools.Select.unselect();
			MapMan.Stages.hideLayer(id);
		});

		/* 
		 * EVENT: Triggered when the 'visible' icon is toggled on in the layer view
		 * RESPONSE: Reactivates a layer's objects
		 */
		this.layerView.events.on('layerUnhidden', (id) => {
			MapMan.Stages.unhideLayer(id);
		});

	},

	addSelectionEvents: function(){

		MapMan.Tools.Select.events.on('selectionChanged', (wrapper) => {

			var wrapper = MapMan.Tools.Select.getSelection();

			if (wrapper){
				this.tabView.triggerActive('selectionChanged', wrapper);
			}

		});

		MapMan.Tools.Select.events.on('selectionEdited', (wrapper) => {
			var wrapper = MapMan.Tools.Select.getSelection()

			if (wrapper){
				this.tabView.triggerActive('selectionEdited', wrapper);
			}

		});

		MapMan.Tools.Select.events.on('unselect', () => {
			this.tabView.triggerActive('unselect');
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
								
					var x = this.game.input.mousePointer.worldX;
					var y = this.game.input.mousePointer.worldY;

					this.stageManager.addToStage(x, y, newObj);
					this.layerView.addObject(newObj);

					MapMan.Stages.active.add(newObj);
					MapMan.Stages.setLayerOrder(this.layerView.getLayerOrder().reverse(), true); //Refresh the layer order

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
					preferences: document.getElementById('edit-preferences'),

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

		/* 
		 * EVENT: "Preferences" is clicked from menu bar
		 * RESPONSE: Preference modal menu is opened
		 */
		Edit.preferences.addEventListener('click', (event) => {	

			$( '#preference-menu' ).dialog({
				modal: true,
				width: 600,
				height: 300,
				resizable: false,
				buttons: {
					Apply: () => {
						$('#preference-menu').dialog('close');

						MapMan.Settings.set(this.preferenceForm.bundle());

					}
				}
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
