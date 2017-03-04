//Sits between ObjectFactory and the stage
//Handles adding and removing objects from the stage
class StageManager {

	constructor(stage){
		this.stage = stage;

		this.keyIndex = 0;
		this.idIndex = 0;
	}
	
	addToStage(x, y, imageKey){
		var obj = MapMan.Objects.newObject(imageKey);
			obj.display.centerX = x;
			obj.display.centerY = y;

		this.stage.add.existing(obj.display);
	}

	deleteSelection(){
		var wrapper = MapMan.Tools.Select.getSelection().delete();

		MapMan.Stages.action({

							type: 'Delete Object',
							target: wrapper,
							undo: wrapper.undelete,
							context: wrapper,
							params: []

							});
	}


}


class ProjectManager {

	constructor(game){
		this.game = game;
		this.fileAccess = new FileAccess();
	}

	newProject(callback){

		var options = 	{
							title: 'New Project',
							buttonLabel: 'Create Working Directory',
						}

		DIALOG.showSaveDialog(options, (path) => {
			if (path){
				this.fileAccess.buildDirectory(path, ['asset', 'object', 'prefab'], (err, result) => {
					if (err){

						return false;

					} else {

						if (callback){
							callback(path);
						}

					}

				});
			}
		});


	}

}







