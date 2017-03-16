class ToolBox {
	constructor(stage){
		this.stage = this.game = stage;
		this.stage.plugins.add(this);
		this.hasPreUpdate = true;
		this.hasPostUpdate = true;

		//Active tools only receive input events when they are active
		this.Select = new Selector(stage);
		this.Nav = new Navigator(stage);
		this.Zoom = new Zoom(stage);
		this.Grid = new Grid(stage);
		this.Frames = new ScreenFrames(stage);
		this.UILayers = new EditorLayers(stage);
		this.addLayers();

		//Passive tools are constantly updated 
		this.passiveTools = [this.Select, this.Nav]; 

		this.stage.input.onDown.add(this.startTool, this);
		this.stage.input.onUp.add(this.endTool, this);
	}

	addLayers(){

		this.UILayers.toTop(() => {
			this.Frames.bringToTop();
		});

	}

	startTool(pointer){
		for (var i = 0; i < this.passiveTools.length; i++){
			this.passiveTools[i].start(pointer);
		}
	}

	endTool(pointer){
		for (var i = 0; i < this.passiveTools.length; i++){
			this.passiveTools[i].end(pointer);
		}
	}

	preUpdate(){
		for (var i = 0; i < this.passiveTools.length; i++){
			if (this.passiveTools[i].preUpdate){
				this.passiveTools[i].preUpdate();
			}
		}
	}

	update(){
		for (var i = 0; i < this.passiveTools.length; i++){
			this.passiveTools[i].update();
		}
	}

	postUpdate(){
		for (var i = 0; i < this.passiveTools.length; i++){
			if (this.passiveTools[i].postUpdate){
				this.passiveTools[i].postUpdate();
			}
		}
	}

}

class EditorLayers {
	constructor(game){
		this.game = game;

		this.bottom = []; //Always on the bottom
		this.layers = []; //Brought to top based on the order in which each layer was added
		this.top = []; //Always brought to top last

	}

	//Restacks all layers
	restackBottom(){
		this.bottom.forEach((bringToTop) => {
			bringToTop();
		});

		this.layers.forEach((bringToTop) => {
			bringToTop();
		});

		this.top.forEach((bringToTop) => {
			bringToTop();
		})
	}

	//Restacks from middle up
	restackLayers(){
		this.layers.forEach((bringToTop) => {
			bringToTop();
		});

		this.top.forEach((bringToTop) => {
			bringToTop();
		});
	}

	//Restacks only the top layer
	restackTop(){
		this.top.forEach((bringToTop) => {
			bringToTop();
		});
	}

	toBottom(bringToTop){
		this.bottom.push(bringToTop);
	}

	toTop(bringToTop){
		this.top.push(bringToTop);
	}

	addLayer(position){
		this.layers.push(bringToTop);
	}
}

class Selector {

	constructor(stage){
		this.stage = stage;
		this.events = new EventManager();

		this.selection = undefined;
		this.groupSelection = [];
		this.multiSelect = undefined;
		this.triggerEditOnRelease = false;	//Flag to prevent every single mouseup event from triggering the selectionEdit event

		var graphics = this.stage.add.graphics(0, 0);
			graphics.beginFill(0x00ff00, .8);
			graphics.drawRect(0, 0, 100, 100);
			graphics.visible = false;
		var texture = graphics.generateTexture();

		this.selectBox = this.stage.add.sprite(0,0, texture);
		this.selectBox.visible = false;
		this.selectBox.alpha = .5;

		this.Scale = new Scaler(this.stage);
		this.Rotate = new Rotator(this.stage);
		this.subTools = [this.Scale, this.Rotate];
		this.activeSubTool = undefined;

	}

	setActiveTool(tool){
		//Deactivate the active tool if it is toggled off and don't activate any other tool
		if (this.activeSubTool === tool){

			this.activeSubTool.end();
			this.activeSubTool = undefined;

		//If the given tool is different than the active tool, switch tools
		} else {

			if (this.activeSubTool) { 
				this.activeSubTool.end(); 
			}

			this.activeSubTool = tool;

			if (this.selection){
				this.activeSubTool.start(this.selection);
			}

		}
	}

	start(pointer){
		if (this.stage.input.mousePointer.leftButton.isDown){

			if (pointer.targetObject){

				if (pointer.targetObject.sprite.wrapper){

					if (this.selection || this.groupSelection.length > 0){
						this.unselect();
					}

					this.select(pointer.targetObject.sprite.wrapper);
				}

			} else {

				if (this.selection || this.groupSelection.length > 0){
					this.unselect();
				}

				this.startMultiSelect();

			}
		}
	}

	select(wrapper){
		if (MapMan.Stages.inActiveLayer(wrapper)){
			this.selection = wrapper;
			this.triggerEditOnRelease = true;
			this.selection.select();

			if (this.activeSubTool){
				this.activeSubTool.start(wrapper);
			}

			this.events.trigger('selectionChanged', this.selection);
		}
	}

	unselect(){
		if (this.selection){
			this.selection.unselect();
			this.selection = undefined;	
		}

		this.groupSelection.forEach((wrapper)=> {
			wrapper.unselect();
		});
		this.groupSelection = [];

		this.subTools.forEach((tool) => {
			tool.end();
		});

		this.events.trigger("unselect");
	}

	startMultiSelect(){
		this.multiSelect = true;
		this.selectBox.bringToTop();
		this.selectBox.visible = true;

		this.mouseDownX = this.stage.input.mousePointer.screenX;
		this.mouseDownY = this.stage.input.mousePointer.screenY;

		this.selectCornerX = this.stage.input.mousePointer.worldX;
		this.selectCornerY = this.stage.input.mousePointer.worldY;
	}

	endMultiSelect(){
		this.multiSelect = false;
		this.selectBox.visible = false;

		//Invert the bounds rectangle if the widht or height is negative//
		//--------------------------------------------------------------//
		if (this.selectBox.width < 0){
			var x = this.selectCornerX - Math.abs(this.selectBox.width);
			var width = Math.abs(this.selectBox.width);
		} else {
			var x = this.selectCornerX;
			var width = this.selectBox.width;
		}

		if (this.selectBox.height < 0){
			var y = this.selectCornerY - Math.abs(this.selectBox.height);
			var height = Math.abs(this.selectBox.height);
		} else {
			var y = this.selectCornerY;
			var height = this.selectBox.height;
		}
		//--------------------------------------------------------------//


		//Check each wrapper in the active layer against the selection bounds
		//-----------------------------------------------------------------------------//
		var boundBox = new Phaser.Rectangle(x, y, width, height);
		var selectables = MapMan.Stages.active.getActiveLayerObjects();

		selectables.forEach((wrapper) => {
			if (!wrapper.deleted){
				if (boundBox.contains(wrapper.display.centerX, wrapper.display.centerY)){

					wrapper.select();
					this.groupSelection.push(wrapper);

				} else {

					wrapper.unselect();

				}
			}
		});
		//-----------------------------------------------------------------------------//

	}

	contains(rectangle, wrapper){
		//TO DO: Create more inclusive contains method
	}

	update(){
		if (this.multiSelect){
			this.selectBox.x = this.selectCornerX;
			this.selectBox.y = this.selectCornerY;
			this.selectBox.width = (this.stage.input.mousePointer.screenX - this.mouseDownX);
			this.selectBox.height = (this.stage.input.mousePointer.screenY - this.mouseDownY);
		}

		if (this.selection && this.activeSubTool){
			this.activeSubTool.update();
		}
	}

	postUpdate(){
		if (this.selection && this.activeSubTool){
			if (this.activeSubTool.postUpdate){
				this.activeSubTool.postUpdate();
			}
		}
	}

	preUpdate(){
		if (this.selection && this.activeSubTool){
			if (this.activeSubTool.preUpdate){
				this.activeSubTool.preUpdate();
			}
		}
	}

	end(){
		if (this.triggerEditOnRelease){
			this.events.trigger('selectionEdited', this.selection);
			this.triggerEditOnRelease = false;
		}

		if (this.multiSelect){
			this.endMultiSelect();
		}

	}

	getSelection(){
		return this.selection;
	}

	getGroupSelection(){
		return this.groupSelection;
	}

}

class ScaleHandle extends Phaser.Sprite {
	constructor(game, texture, position){
		super(game, 0, 0, texture);

		this.game = game;
		this.target = undefined;
		this.dragging = false;
		this.follow = this[position];
		this.scaleTarget = this[position + 'Scale'];

		this.visible = false;
		this.anchor.setTo(.5,.5);
		this.inputEnabled = true;
		this.input.enableDrag();

		this.targetStartWidth = 0;
		this.targetStartHeight = 0;
		this.dragStartX = 0;
		this.dragStartY = 0;
		this.dragDifferenceX = 0;
		this.dragDifferenceY = 0;
		this.snapX = 32;
		this.snapY = 32;

		this.events.onDragStart.add(this.dragStart, this);
		this.events.onDragStop.add(this.dragEnd, this);

		this.game.add.existing(this);
	}

	dragStart(){
		this.dragging = true;

		if (this.snapEnabled){
			var gridOffsetX = (this.target.width % this.snapX);
			var gridOffsetY = (this.target.height % this.snapY);

			this.targetStartWidth = this.target.width - gridOffsetX;
			this.targetStartHeight = this.target.height - gridOffsetY;
			this.target.centerX = Math.round(this.target.centerX + gridOffsetX / 2);
			this.target.centerY = Math.round(this.target.centerY + gridOffsetY / 2);

		} else {

			this.targetStartWidth = this.target.width;
			this.targetStartHeight = this.target.height;

		}

		this.targetStartX = this.target.centerX;
		this.targetStartY = this.target.centerY;
		this.dragStartX = this.x;
		this.dragStartY = this.y;
	}

	dragEnd(callback){
		this.dragging = false;		
		this.dragStartX = this.x;
		this.dragStartY = this.y;
	}

	setSnapSize(size){
		this.gridX = size;
		this.gridY = size;

		if (this.snapEnabled){
			this.input.enableSnap(this.gridX, this.gridY, true, true);
		}
	}

	toggleSnap(gridX, gridY){
		if (this.snapEnabled){

			this.snapEnabled = false;
			this.input.disableSnap();

		} else {

			this.snapEnabled = true;
			this.snapX = gridX;
			this.snapY = gridY;
			this.input.enableSnap(gridX, gridY, true, true);

		}
	}

	updateTarget(){
		if (!this.dragging){

			this.follow();

		} else {

			this.dragDifferenceX = this.x - this.dragStartX;
			this.dragDifferenceY = this.y - this.dragStartY;

			this.scaleTarget();

			this.target.centerX = this.targetStartX + (this.dragDifferenceX / 2);
			this.target.centerY = this.targetStartY + (this.dragDifferenceY / 2);

		}
	}

	setFollowTarget(target){
		this.visible = true;
		this.bringToTop();
		this.target = target;
	}

	unsetFollowTarget(){
		this.visible = false;
		this.target = undefined;
	}

	topLeftScale(){
		this.target.width = this.targetStartWidth - this.dragDifferenceX;
		this.target.height = this.targetStartHeight - this.dragDifferenceY;
	}

	bottomLeftScale(){
		this.target.width = this.targetStartWidth - this.dragDifferenceX;
		this.target.height = this.targetStartHeight + this.dragDifferenceY;
	}

	topRightScale(){
		this.target.width = this.targetStartWidth + this.dragDifferenceX;
		this.target.height = this.targetStartHeight - this.dragDifferenceY;
	}

	bottomRightScale(){
		this.target.width = this.targetStartWidth + this.dragDifferenceX;
		this.target.height = this.targetStartHeight + this.dragDifferenceY;
	}


	topLeft(){
		this.x = this.target.boundsLeft;
		this.y = this.target.boundsTop;
	}

	bottomLeft(){
		this.x = this.target.boundsLeft;
		this.y = this.target.boundsBottom;
	}

	topRight(){
		this.x = this.target.boundsRight;
		this.y = this.target.boundsTop;
	}

	bottomRight(){
		this.x = this.target.boundsRight;
		this.y = this.target.boundsBottom;
	}

}

class Scaler {
	constructor(stage){
		this.stage = stage;

		this.resizable = undefined;
		this.startWidth = 0;
		this.startHeight = 0;

		var graphics = this.stage.add.graphics(0, 0);
			graphics.beginFill(0x00ff00, .7);
			graphics.lineStyle(2, 0x00ff00, 1);
			graphics.drawRect(0, 0, 15, 15);
			graphics.visible = false;
		var handleTexture = graphics.generateTexture();

		this.leftTop = new ScaleHandle(this.stage, handleTexture, 'topLeft');
		this.leftBottom = new ScaleHandle(this.stage, handleTexture, 'bottomLeft');
		this.rightTop = new ScaleHandle(this.stage, handleTexture, 'topRight');
		this.rightBottom = new ScaleHandle(this.stage, handleTexture, 'bottomRight');
		this.handles = [this.leftTop, this.leftBottom, this.rightTop, this.rightBottom];
	}

	setHandleSnapSize(size){
		this.handles.forEach((handle) => {
			handle.setSnapSize(size);
		});	
	}

	setHandleSnap(gridX, gridY){
		this.handles.forEach((handle) => {
			handle.toggleSnap(gridX, gridY);
		});	
	}

	unsetHandleSnap(){
		this.handles.forEach((handle) => {
			handle.toggleSnap();
		});		
	}

	start(wrapper){
		this.resizable = wrapper.display;

		this.handles.forEach((handle) => {
			handle.setFollowTarget(wrapper.display);
		});
	}

	end(pointer){
		this.handles.forEach((handle) => {
			handle.unsetFollowTarget();
		});
	}

	update(){
		this.handles.forEach((handle) => {
			handle.updateTarget();
		});
	}

}

class RotateHandle extends Phaser.Sprite {
	constructor(game, texture){
		super(game, 0, 0, null);

		this.game = game;
		this.target = undefined;
		this.following = false;

		this.targetStartX = 0;
		this.targetStartY = 0;
		this.targetStartAngle = 0;
		this.mouseStartAngle = 0;
		//this.angleDifference = 0;

		this.visible = false;
		this.anchor.setTo(.5,.5);
		this.inputEnabled = true;

		this.events.onInputDown.add(this.rotateStart, this);
		this.events.onInputUp.add(this.rotateEnd, this);

		this.game.add.existing(this);
	}

	rotateStart(){
		this.targetStartAngle = this.target.angle;
		this.mouseStartAngle = Phaser.Math.angleBetween(this.game.input.mousePointer.x, this.game.input.mousePointer.y, this.target.x, this.target.y);

		this.rotating = true;
	}

	rotateEnd(){
		this.rotating = false;
	}


	update(){
		if (this.target){
			this.x = this.target.x;
			this.y = this.target.y;
		}

		if (this.rotating){

			let mouseAngle = Phaser.Math.angleBetween(this.game.input.mousePointer.x, this.game.input.mousePointer.y, this.target.x, this.target.y);
			let angleDifference = Phaser.Math.radToDeg(mouseAngle - this.mouseStartAngle);

			this.target.angle = Math.floor(this.targetStartAngle + angleDifference);

		}
	}

	redraw(target){
		var diameter = Math.sqrt(Math.pow(target.width, 2) + Math.pow(target.height, 2));

		var graphics = this.game.add.graphics(0, 0);
			graphics.lineStyle(2, 0x00ff00, 1);
			graphics.drawCircle(0, 0, diameter);
			graphics.lineStyle(2, 0x0000ff, 1);
			graphics.drawCircle(0, 0, 5);
			graphics.visible = false;

		this.loadTexture(graphics.generateTexture());
		this.bringToTop();

	}

	setTarget(target){
		this.target = target;
		this.redraw(target);
		this.visible = true;
		this.following = true;
	}

	unsetTarget(){
		this.target = undefined;
		this.following = false;
		this.visible = false;
	}

}

class Rotator {
	constructor(game){
		this.game = game;

		this.rotateHandle = new RotateHandle(this.game);
	}

	start(wrapper){
		this.rotateHandle.setTarget(wrapper.display);
	}

	end(){
		this.rotateHandle.unsetTarget();
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

		this.enabled = false;
		this.update = this.dragCamera;
	}

	start(pointer) {

		//Only drag if the middle mouse button is down
		if (this.stage.input.mousePointer.middleButton.isDown) {

			this.staticPoint.x = pointer.screenX;
			this.staticPoint.y = pointer.screenY;

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

			var movementX = (this.staticPoint.x - this.stage.input.mousePointer.screenX);
			var movementY = (this.staticPoint.y - this.stage.input.mousePointer.screenY);

			this.stage.camera.x = this.previousCameraPosition.x + movementX;
			this.stage.camera.y = this.previousCameraPosition.y + movementY;

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

		if (event.target.nodeName === 'CANVAS'){

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

			/*
			console.log('-------------------------');
			console.log("ZOOM: " + this.zoomFactor);
			console.log("SCALE:" + this.scaleFactor);
			console.log("WIDTH: " + this.game.width);
			console.log(this.game.world.pivot);
			console.log('-------------------------');
			*/

			this.game.world.scale.set(1 - this.zoomFactor);
			this.clampCameraToGrid();

		}


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
		this.gridColor = 0xffffff;

		//Sprite marking grid origin
		this.originSprite = this.stage.add.sprite(0,0, 'origin');
		this.originSprite.anchor.setTo(.5,.5);
		this.originSprite.visible = false;
		this.originSprite.alpa = .3;

		MapMan.ObjectPool.addBirthModifier(function(wrapper){

			if (this.gridOn){
				wrapper.display.input.enableSnap(this.gridX, this.gridY, true, true);
			}

		}.bind(this));

	}

	setColor(hex){
		this.gridColor = hex;

		if (this.gridOn) {
			this.destroyGrid();
			this.drawGrid();
		}	
	}

	setSize(gridSize){
		if (gridSize !== this.gridX || gridSize !== this.gridY){

			this.gridX = gridSize;
			this.gridY = gridSize;

			if (this.gridOn) {
				this.destroyGrid();
				this.drawGrid();
				this.enableObjectSnap();
			}	
		}
	}

	toggleGrid(){

		if (this.gridOn){

			//this.destroyGrid();
			this.hideGrid();
			this.gridOn = false;
			this.originSprite.visible = false;

			MapMan.ObjectPool.modifyAll(function(wrapper){

				wrapper.display.input.disableSnap();

			}.bind(this));
			MapMan.Tools.Select.Scale.unsetHandleSnap(this.gridX, this.gridY);

		} else {

			if (this.gridSprites.length === 0){
				this.drawGrid();
			} else {
				this.unhideGrid();	
			}

			this.gridOn = true;
			this.originSprite.visible = true;

			this.enableObjectSnap();
			MapMan.Tools.Select.Scale.setHandleSnap(this.gridX, this.gridY); //This should be moved to a 'gridOn' event or something
		}

	}

	//This should be moved to a 'gridOn' event or something
	enableObjectSnap(){
		MapMan.ObjectPool.modifyAll(function(wrapper){

			wrapper.display.input.enableSnap(this.gridX, this.gridY, true, true);
			this.stage.world.bringToTop(wrapper.bounds);

		}.bind(this));
		MapMan.Stages.restack();	
	}

	getGridTexture(){
		var grid = this.stage.add.graphics(0, 0);
			grid.lineStyle(1, this.gridColor, 1);
			grid.visible = false;

		for (var w = 0; w < 20; w++){
			for (var h = 0; h < 20; h++){
				grid.drawRect(w * this.gridX, h * this.gridY, this.gridX - 1, this.gridY - 1);
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

	hideGrid(){
		for (var i = 0; i < this.gridSprites.length; i++){
			this.gridSprites[i].visible = false;
		}
	}

	unhideGrid(){
		for (var i = 0; i < this.gridSprites.length; i++){
			this.gridSprites[i].visible = true;
		}
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

				var sprite = this.stage.add.image( (gridWidth * w), (gridHeight * h), texture );
					sprite.alpha = .2;

				var style = { font: "12px Arial", fill: "#fff" }
				var label = this.stage.add.text(sprite.x + 5, sprite.y + 5, '(' + (sprite.x + 1) + " , " + (sprite.y + 1) + ')', style);

				this.gridSprites.push(sprite);
				this.gridSprites.push(label);
			}
		}

	}

}

class ScreenFrames {
	constructor(game){
		this.game = game;

		this.framesOn = false;
		this.frames = [];
		this.addFrame(450, 800, 0x551a8b);

	}

	addFrame(width, height, color){
		var color = color ? color : 0x551a8b;

		this.frames.push({ width: width, height: height, color: color, sprite: undefined, label: undefined });
	}

	toggleFrames(){

		if (this.framesOn){

			this.framesOn = false;
			this.hideFrames();

		} else {

			this.framesOn = true;
			this.drawFrames();
			this.showFrames();

		}
	}

	drawFrames(){
		this.frames.forEach((frame) => {
			if (!frame.sprite){

				var g = this.game.add.graphics(0, 0);
					g.lineStyle(3, frame.color, 1);
					g.drawRect(0, 0, frame.width, frame.height);
					g.visible = false;

					frame.sprite = this.game.add.sprite(0, 0, g.generateTexture());
					frame.sprite.visible = false;

					frame.label = this.game.add.text(frame.width + 5, 0, 'W:' + frame.width + ' H:' + frame.height, { font: "12px Arial", fill:  '#fff' });
					frame.label.visible = false;
					frame.label.tint = frame.color;
			}
		});
	}

	hideFrames(){
		this.frames.forEach((frame) => {
			if (frame.sprite){
				frame.sprite.visible = false;
				frame.label.visible = false;
			}
		});
	}

	showFrames(){
		this.frames.forEach((frame) => {
			if (frame.sprite){
				frame.sprite.visible = true;
				frame.label.visible = true;
			}
		});
	}

	destroyFrames(){
		this.frames.forEach((frame) => {
			if (frame.sprite){
				frame.sprite.destroy();
				frame.label.destroy();
				frame.sprite = undefined;
				frame.label = undefined;
			}
		});
	}

	bringToTop(){
		this.frames.forEach((frame) => {
			if (frame.sprite){
				frame.sprite.bringToTop();
			}
		});	
	}


}
