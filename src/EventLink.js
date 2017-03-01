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
		this.stageManager = new StageManager(this.game);

		//UI Components
		this.assetView = new AssetView(document.getElementById('freewall'));
		this.toolbarView = new ToolbarView();

		this.addKeyMap();

		/* 
		 * EVENT: Image dropped onto canvas from AssetView
		 * RESPONSE: Image is loaded if not already in cache, new Wrapper object is created
		 */
		this.assetView.events.on('assetDropped', function(position, data){

			if (data){

				MapMan.Assets.load(data.path, function(key){

					var pos = MapMan.Tools.Zoom.adjustedPosition(this.game.input.mousePointer.worldX, this.game.input.mousePointer.worldY);
					console.log(pos);

					this.stageManager.addToStage(pos.x, pos.y, key);

				}.bind(this));

			}

		}.bind(this));

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

	addKeyMap: function() {

		Mousetrap.bind(['del'], function(e) {
			this.stageManager.deleteSelection();
		}.bind(this));

		Mousetrap.bind(['ctrl+z'], function(e) {
			MapMan.Stages.active.actions.undo();
		}.bind(this));


		//Arrow controls
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

	}




}
