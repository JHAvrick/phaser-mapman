var EventLink = {

	preload(){ 
		MapMan.Objects = new ObjectMaster(this.game);
		MapMan.Stages = new StageMaster(this.game);
		MapMan.Assets = new AssetMaster(this.game);
		MapMan.Tools = new ToolBox(this.game);
	},

	render(){

		var pos = MapMan.Tools.Zoom.adjustedPosition(this.game.input.mousePointer.worldX, this.game.input.mousePointer.worldY);

		this.game.debug.text('X: ' + pos.x + ' Y: ' + pos.y, 32, 32);
	},

	create: function(){
		MapMan.Stages.newStage('default');
		MapMan.Stages.setActive('default');

		//Editor Components
		this.projectManager = new ProjectManager(this.game);
		this.stageManager = new StageManager(this.game);

		//UI Components
		this.assetView = new AssetView(document.getElementById('freewall'), this.fileAccess);
		this.toolbarView = new ToolbarView();


		this.addMenuBarEvents();
		this.addKeyMapEvents();

		/* 
		 * EVENT: Image dropped onto canvas from AssetView
		 * RESPONSE: Image is loaded if not already in cache, new Wrapper object is created
		 */
		this.assetView.events.on('assetDropped', function(position, data){

			if (data){

				MapMan.Assets.load(data.path, function(key){

					var pos = MapMan.Tools.Zoom.adjustedPosition(this.game.input.mousePointer.worldX, this.game.input.mousePointer.worldY);
					
					console.log(pos);
					console.log(this.game.input.mousePointer.screenX);
					console.log(this.game.input.mousePointer.screenY);

					this.stageManager.addToStage(pos.x, pos.y, key);

				}.bind(this));

			}

		}.bind(this));

		this.assetView.events.on('projectFileFound', (projectPath) => {

			console.log('Project Path:' + projectPath);
			//TO DO: Load project

		});

		/* 
		 * EVENT: Grid tool button is pressed
		 * RESPONSE: Draw or undraw grid and make objects snap to gridlines
		 */
		this.toolbarView.events.on('gridToggled', function(){
			MapMan.Tools.Grid.toggleGrid();
		}.bind(this));

		/* 
		 * EVENT: Scale tool button is pressed
		 * RESPONSE: Disable currently active tool, enable scale tool
		 */
		this.toolbarView.events.on('gridToggled', function(){
			MapMan.Tools.setActive(MapMan.Tools.Scale);
		}.bind(this));

		/* 
		 * EVENT: Return-to-origin button is clicked
		 * RESPONSE: Move the camera back to the origin
		 */
		this.toolbarView.events.on('goToOrigin', function(){
			MapMan.Tools.Zoom.resetZoom();
			this.game.camera.setPosition(0,0);
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

		File.newProject.addEventListener('click', (event) => {

			this.projectManager.newProject( path => {
				if (path){

					this.assetView.hideDragHint();
					this.assetView.reset();
					this.assetView.loadDirTree(path);

				} else {

					console.log("Something has gone terribly wrong...");

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



/*  --------------------------------------------------------------------------------------------------
	|                                             MENU SHORTCUTS                                     |
	--------------------------------------------------------------------------------------------------	*/		

		//DELETE CURRENT SELECTION
		Mousetrap.bind(['del'], function(e) {
			this.stageManager.deleteSelection();
		}.bind(this));

		//
		Mousetrap.bind(['ctrl+z'], function(e) {
			MapMan.Stages.active.actions.undo();
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
