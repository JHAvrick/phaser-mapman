class Wrapper {

	constructor(id, key, stage, displayObject){

		this.id = id;	//Used internally to keep track of objects
		this.deleted = false;	//Deleted flag, deleted objects are not permanently destroyed until the app is closed
		this.hidden = false;
		this.key = key;
		this.whatever = stage;
		this.stage = stage;
		this.display = displayObject;
		this.group = 'all';
		this.layer = 0;
		this.isSelected = false;
		this.lastX = 0;
		this.lastY = 0;

		this.bounds = this.stage.add.graphics(0, 0);
		this.bounds.beginFill(0x00ff00, .5);
		this.bounds.lineStyle(3, 0x00ff00, 2);
		this.bounds.drawRect(0, 0, this.display.width, this.display.height);
		this.bounds.visible = false;
		
		this.display.wrapper = this;
		this.display.inputEnabled = true;
		this.display.input.enableDrag();
		this.display.input.pixelPerfectOver = true;
		this.display.input.pixelPerfectAlpha = 50;
		this.display.update = this.update.bind(this);

		this.display.events.onDragStart.add(this.setLastPosition, this);
		this.display.events.onDragStop.add(this.registerMoveAction, this);

	}

	setLastPosition(){
		this.lastX = this.display.x;
		this.lastY = this.display.y;
	}

	registerMoveAction(){
		if (this.lastX !== this.display.x || this.lastY !== this.display.y){

			var oldX = this.lastX;
			var oldY = this.lastY;

			var self = this;
			MapMan.Stages.action({

					type: 'Moved Object',
					target: self,
					undo: function(oldX, oldY){   
						self.display.x = oldX;
						self.display.y = oldY;
					},
					context: self,
					params: [oldX, oldY]

			});
		}
	}

	update(){
		if (this.isSelected){
			this.bounds.x = this.display.x;
			this.bounds.y = this.display.y;
		}
	}

	hide(){
		this.hidden = true;
		this.display.visible = false;
	}

	unhide(){
		this.hidden = false;
		this.display.visible = true;
	}

	activate(){
		if (!this.deleted){
			this.display.revive();
			this.bounds.revive();
		}
	}

	deactivate(){
		if (!this.deleted){
			this.display.kill();
			this.bounds.kill();
		}
	}

	delete(){
		this.unselect();
		this.deleted = true;
		this.display.kill();
		this.bounds.kill();
		return this;
	}

	undelete(){
		this.deleted = false;
		this.display.revive();
		this.bounds.revive();
		this.bounds.visible = false;
		return this;	
	}

	select(){
		this.stage.world.bringToTop(this.bounds);
		this.isSelected = true;
		this.bounds.visible = true;
		console.log("Selected....");
	}

	unselect(){
		this.isSelected = false;
		this.bounds.visible = false;
	}

}