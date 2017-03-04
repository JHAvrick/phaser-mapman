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

	buildDirectory(dirPath, children, callback){

		var prom = new Promise((resolve, reject) => {

			fs.mkdir(dirPath, (e) => { 
				if (e){
   					if (e.code === 'EEXIST'){
   						reject(e.code);
   					}
   				}

   				resolve();
			});

		}).then((success) => {

			var iterableProms = []; 
			for (let i = 0; i < children.length; i++){

				var newProm = new Promise((resolve, reject) => {

					fs.mkdir(dirPath + Common.path.sep + children[i], (e) => { 
						if (e){
		   					if (e.code === 'EEXIST'){
		   						reject(e.code);
		   					}
		   				}

		   				resolve();
					});

				});

				iterableProms.push(newProm);
			}

			var val = Promise.all(iterableProms).then((values) => {

				if (callback){
					callback(null, dirPath);
				}
				

			}).catch((failure) => {

				if (callback){
					callback(failure, dirPath);
				}

			});

		}).catch((failure) => {

			if (callback){
				callback(failure, dirPath);
			}
			
		});

	}

	copy(fromPath, toPath, callback) {

		var from = Common.path.parse(fromPath);

		fs.stat(toPath, (err, stat) => {
		    if (err == null) {

		    	if (stat.isDirectory()) {

					fs.mkdir(toPath, (e) => { 
						if (!e){
							console.log(e.code)
						}

						if (callback){
							callback(toPath);
						}
					});

		    	} else {

			    	fs.readFile(fromPath, (err, data) => {
					  if (err) throw err;

					  	fs.writeFile(toPath + Common.path.sep + from.name + from.ext, data, (err) => {
							if (err) throw err;

							if (callback){
								callback(toPath + Common.path.sep + from.name + from.ext);
							}
						  	
						});

					});
				}

			} else if (err.code == 'ENOENT') {
			    
				console.log("IO error. Failed to copy asset to working directory.");

			} else {
			    
				console.log("Fatal IO error while copying asset to working directory.");

			}
     
		});

	}

	parsePath(path) {
		return PATH.parse(path);
	}

	pathInfo(path, callback){
		var info = PATH.parse(path);

		fs.lstat(path, (err, stats) => {

			if (!err){

				if (stats.isDirectory()){

					info.type = "dir";

				} else {

					info.type = "file";

				}

				callback(info);
			}
		});

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