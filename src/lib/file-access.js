const PATH = require('path');
const fs = require('fs');

class FileAccess {
	
	constructor(){

	}

	getDirFiles(dirPath, callback){

		fs.readdir(dirPath, (err, files) => {
			if (!err){
				if (files){
					files.forEach(file => {
						var subPath = PATH.join(dirPath, file);

						fs.lstat(subPath, (err, stats) => {
							if ( !err || (/(\/|^|.)\.[^\/\.]/g).test(file) ){
								var item = PATH.parse(subPath);

								if (stats.isDirectory()){

									item.type = "dir";

									callback(item, subPath);

								} else {

									item.type = "file";

									callback(item, subPath);
									
								}
							}

						});

					});
				}

			} else {

				return false;

			}

		});

	}

	pathInfo(path){
		return PATH.parse(path);
	}

	getParentDirectory(dir){
		var split = dir.split(path.sep);

		return dir.slice(0, dir.length - split[split.length - 1].length - 1);
	}



	copyDirectory(dirPath, copyPath, callback){


	}

	buildDirctory(tree, callback){


	}

}

module.exports = FileAccess;