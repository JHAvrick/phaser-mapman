//Sits between ObjectFactory and the stage
//Handles adding and removing objects from the stage
class StageManager {

	constructor(stage){
		this.stage = stage;

		this.keyIndex = 0;
		this.idIndex = 0;
	}
	
	addToStage(x, y, wrapper){
		wrapper.display.centerX = x;
		wrapper.display.centerY = y;

		this.stage.add.existing(wrapper.display);
	}

	deleteSelection(){
		/*
		var wrapper = MapMan.Tools.Select.getSelection();
		var wrapperGroup = MapMan.Tools.Select.getGroupSelection();

		if (wrapper){
			wrapper.delete();

			MapMan.Stages.action({

								type: 'Delete Object',
								target: wrapper,
								undo: wrapper.undelete,
								context: wrapper,
								params: []

								});
		}

		if (wrapperGroup){
			wrapperGroup.forEach((wrapper) => {
				wrapper.delete();
			});

			MapMan.Stages.action({

								type: 'Delete Group',
								target: wrapperGroup,
								undo: () => {
									wrapperGroup.forEach((wrapper) => {
										wrapper.undelete();
									});	
								},
								context: wrapper,
								params: []

								});
		}

		MapMan.Tools.Select.unselect();
		*/

	}


}


class ProjectManager {

	constructor(game){
		this.game = game;
		this.fileAccess = new FileAccess();

		this.projectActive = false;
		this.config = require("./resources/conf.json");

	}

	newProject(callback){

		var options = 	{
							title: 'New Project',
							buttonLabel: 'Create Working Directory',
						}

		DIALOG.showSaveDialog(options, (path) => {
			if (path){

				
				this.fileAccess.buildDirectory(path, [], (err, result) => {
					if (err){

						return false;

					} else {

						var project = 	{
											name: path.split(Common.path.sep).pop(),
											config: this.config,
										}

						Promise.all([
										this.fileAccess.copy('./resources/default/asset', path),
										this.fileAccess.copy('./resources/default/object', path),
										this.fileAccess.copy('./resources/default/prefab', path),
										this.fileAccess.copy('./resources/default/scene', path),
										this.fileAccess.writeAsJSON(path, 'project.json', project),

						]).then(() => {

							if (callback){
								callback(path);
							}

						});


					}

				});
				

			}
		});

	}

	openProject(callback){

		DIALOG.showOpenDialog({ properties: ['openDirectory']}, (projectRoot) => {
			if (projectRoot){

				if (callback){
					callback(projectRoot[0]);
				}
				
			}
		});

	}

	loadProject(rootDir){

		this.fileAccess.loadJSON(rootDir + Common.path.sep + 'project.json').then((json) => {
			//MapMan.globalReset();
			this.projectActive = true;

			//Load object defintions
			this.fileAccess.loadAllJSON(rootDir + Common.path.sep + 'object').then((data) => {
				MapMan.Definitions.addAll(data);
				MapMan.Definitions.setActive('Sprite');
				console.log(MapMan.Definitions.getActive());
			});


			console.log("Load: " + rootDir);

			//TO DO: Load object files


		}).catch((err) => {

			console.log(err);

		});

	}



}







