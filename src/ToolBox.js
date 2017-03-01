class ToolBox {
	constructor(stage){
		this.stage = this.game = stage;
		this.stage.plugins.add(this);

		this.Select = new Selector(stage); //Always on
		this.Nav = new Navigator(stage);	//Always on
		this.Zoom = new Zoom(stage);
		this.Grid = new Grid(stage);	//Reactive
		this.Scale = new Scaler(stage);	

		this.passiveTools = [this.Select, this.Nav];
		this.activeTool = this.Scale;

		this.stage.input.onDown.add(this.startTool, this);
		this.stage.input.onUp.add(this.endTool, this);
	}

	startTool(pointer){
		for (var i = 0; i < this.passiveTools.length; i++){
			this.passiveTools[i].start(pointer);
		}

		this.activeTool.start(pointer);
	}

	endTool(pointer){
		for (var i = 0; i < this.passiveTools.length; i++){
			this.passiveTools[i].end(pointer);
		}

		this.activeTool.end(pointer);
	}

	update(){
		this.Nav.update();

		this.activeTool.update();
	}


}

class Selector {

	constructor(stage){
		this.stage = stage;
		this.selection = undefined;
		this.events = new CallbackManager();
	}

	start(pointer){
		if (this.stage.input.mousePointer.leftButton.isDown){
			if (pointer.targetObject){
				if (pointer.targetObject.sprite.wrapper){
					if (this.selection){
						this.selection.unselect();
					}

					this.selection = pointer.targetObject.sprite.wrapper;
					this.selection.select();

				}
			}
		}

		this.events.trigger('selectionChanged', this.selection);
	}

	end(){

	}

	getSelection(){
		return this.selection;
	}

}

class Scaler {
	constructor(stage){
		this.stage = stage;
	}

	start(pointer){


	}

	end(pointer){


	}

	update(){

	}

}

class Navigator {

	constructor(stage){
		this.stage = stage;
		this.stage.camera.roundPx = false;	//IMPORTANT!

		this.handle = this.stage.add.sprite(0,0, 'handle-drag');
		this.handle.anchor.setTo(.5,.5);
		this.handle.visible = false;

		this.previousCameraPosition = {x: 0, y: 0};
		this.staticPoint = {x: 0, y: 0};
		this.snapX = 32;
		this.snapY = 32;

		this.enabled = false;
		this.update = this.dragCamera;
	}

	start(pointer) {
		//Use snap mode when the Grid is enabled
		if (MapMan.Tools.Grid.gridOn){

			this.snapX = MapMan.Tools.Grid.gridX;
			this.snapY = MapMan.Tools.Grid.gridY;

			this.update = this.dragCameraOnGrid;

		} else {

			this.update = this.dragCameraOnGrid;

		}

		//Only drag if the middle mouse button is down
		if (this.stage.input.mousePointer.middleButton.isDown) {

			this.staticPoint.x = pointer.worldX;
			this.staticPoint.y = pointer.worldY;

			this.previousCameraPosition.x = this.stage.camera.x;	
			this.previousCameraPosition.y = this.stage.camera.y;

			this.handle.visible = true;

			this.enabled = true;
		}
	}

	end(pointer){
		this.handle.visible = false;
		this.enabled = false;
	}

	
	dragCamera(pointer){

		if (this.enabled){
			
			this.handle.x = this.stage.input.mousePointer.worldX;
			this.handle.y = this.stage.input.mousePointer.worldY;

			this.stage.camera.x = this.previousCameraPosition.x + (this.staticPoint.x - this.stage.input.mousePointer.worldX);
			this.stage.camera.y = this.previousCameraPosition.y + (this.staticPoint.y - this.stage.input.mousePointer.worldY);

		}

	}

	dragCameraOnGrid(pointer){

		if (this.enabled){
			
			this.handle.x = this.stage.input.mousePointer.worldX;
			this.handle.y = this.stage.input.mousePointer.worldY;

			var newX = this.previousCameraPosition.x + (this.staticPoint.x - this.stage.input.mousePointer.worldX);
			var newY = this.previousCameraPosition.y + (this.staticPoint.y - this.stage.input.mousePointer.worldY);

			if (newX >= this.snapX){

				this.stage.camera.x = this.previousCameraPosition.x - this.snapX;

				this.previousCameraPosition.x = this.stage.camera.x;
				//this.staticPoint.x = this.stage.input.mousePointer.worldX;

			} else if (newX <= -this.snapX){

				this.stage.camera.x = this.previousCameraPosition.x + this.snapX;

				this.previousCameraPosition.x = this.stage.camera.x;
				//this.staticPoint.x = this.stage.input.mousePointer.worldX;	

			}

			if (newY >= this.snapY){

				this.stage.camera.y = this.previousCameraPosition.y - this.snapY;

				this.previousCameraPosition.y = this.stage.camera.y;
				//this.staticPoint.y = this.stage.input.mousePointer.worldY;

			} else if (newY <= -this.snapY){

				this.stage.camera.y = this.previousCameraPosition.y + this.snapY;

				this.previousCameraPosition.y = this.stage.camera.y;
				//this.staticPoint.y = this.stage.input.mousePointer.worldY;	

			}

		}

	}

}

class Zoom {

	constructor(game){
		this.game = game;


		this.zoomFactor = 0;
		this.scaleFactor = 1;

		this.lowerLimit = -2.05;	//Deepest zoom-in allowed
		this.upperLimit = .80;	//Deepest zoom-out allowed

		document.addEventListener("mousewheel", this.zoom.bind(this));
	}

	zoom(event){

		//Zoom out
		if (event.deltaY > 0){

			if (this.zoomFactor + .05 < this.upperLimit){

				this.zoomFactor += .05;
				this.scaleFactor -= .05;

			}

		//Zoom in
		} else {

			if (this.zoomFactor - .05 > this.lowerLimit){

				this.zoomFactor -= .05;
				this.scaleFactor += .05;

			}

		}

		console.log('-------------------------');
		console.log("ZOOM: " + this.zoomFactor);
		console.log("SCALE:" + this.scaleFactor);
		console.log("WIDTH: " + this.game.width);
		console.log(this.game.world.pivot);
		console.log('-------------------------');

		this.game.world.scale.set(1 - this.zoomFactor);
		this.clampCameraToGrid();

	}

	resetZoom(){

		this.zoomFactor = 0;
		this.scaleFactor = 1;
		this.game.world.scale.set(1 - this.zoomFactor);
		this.clampCameraToGrid();

	}

	clampCameraToGrid(){
		var clampX = MapMan.Tools.Grid.gridX * this.scaleFactor;
		var clampY = MapMan.Tools.Grid.gridY * this.scaleFactor;

		this.game.camera.x = Math.ceil(this.game.camera.x / clampX) * clampX
		this.game.camera.y = Math.ceil(this.game.camera.y / clampY) * clampY;
	}

	adjustedPosition(x, y){
		var adjX = this.game.width * this.zoomFactor;
		var adjY = this.game.height * this.zoomFactor;

		return { x: x + adjX, y: y + adjY }
	}

}

class Grid {

	constructor(stage){
		this.stage = stage;

		this.gridOn = false;
		this.grid = undefined;
		this.gridSprites = [];
		this.gridX = 32;
		this.gridY = 32;

		//Sprite marking grid origin
		this.originSprite = this.stage.add.sprite(0,0, 'origin');
		this.originSprite.anchor.setTo(.5,.5);
		this.originSprite.visible = false;
		this.originSprite.alpa = .3;

		MapMan.Objects.pool.addBirthModifier(function(wrapper){

			if (this.gridOn){
				wrapper.display.input.enableSnap(this.gridX, this.gridY, true, true);
			}

		}.bind(this));

	}

	toggleGrid(){

		if (this.gridOn){

			this.destroyGrid();
			this.gridOn = false;
			this.originSprite.visible = false;

			MapMan.Objects.pool.modifyAll(function(wrapper){

				wrapper.display.input.disableSnap();

			}.bind(this));

		} else {

			this.drawGrid();
			this.gridOn = true;
			this.originSprite.visible = true;

			//Bring objects up above grid
			MapMan.Objects.pool.modifyAll(function(wrapper){

				wrapper.display.input.enableSnap(this.gridX, this.gridY, true, true);
				wrapper.display.bringToTop();
				this.stage.world.bringToTop(wrapper.bounds);

			}.bind(this));

		}

	}

	getGridTexture(){
		var grid = this.stage.add.graphics(0, 0);
			grid.lineStyle(2, 0xffffff, 1);
			grid.visible = false;

		for (var w = 0; w < 20; w++){
			for (var h = 0; h < 20; h++){
				grid.drawRect(w * this.gridX, h * this.gridY, this.gridX + 1, this.gridY + 1);
			}
		}

		return grid.generateTexture();
	}

	destroyGrid(){
		for (var i = 0; i < this.gridSprites.length; i++){
			this.gridSprites[i].destroy();
		}
		this.gridSprites = [];
	}

	drawGrid(){
		if (this.gridSprites.length > 0){
			this.destroyGrid();
		}

		var texture = this.getGridTexture();
		var gridWidth = this.gridX * 20;
		var gridHeight = this.gridY * 20;

		for (var w = -10; w < 10; w++){
			for (var h = -10; h < 10; h++){

				var sprite = this.stage.add.sprite( (gridWidth * w) - 1, (gridHeight * h) - 1, texture );
					sprite.alpha = .2;

				var style = { font: "12px Arial", fill: "#fff" }
				var label = this.stage.add.text(sprite.x + 5, sprite.y + 5, '(' + (sprite.x + 1) + " , " + (sprite.y + 1) + ')', style);

				this.gridSprites.push(sprite);
				this.gridSprites.push(label);
			}
		}

	}

}
