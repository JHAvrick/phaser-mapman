const PATH = require('path');
const fs = require('fs');

class FileAccess {
	
	constructor(){

	}

	pathInfo(path, callback){
		var info = PATH.parse(path);

		fs.lstat(path, (err, stats) => {

			if (!err){

				console.log(stats.isDirectory());

				if (stats.isDirectory()){

					info.type = "dir";

				} else {

					info.type = "file";

				}

				callback(info, path);
			}
		});

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

	copy(from, to){

		//This promise is only resolved once isDirectory returns false and the recursion stops
		//Forgive me future self
		return new Promise((resolve, reject) => {

			this.isDirectory(from).then((isDirectory) => {
				if (isDirectory){

					this.makeDir(to, this.getFileName(from)).then( dirPath => {

						fs.readdir(from, (err, files) => {

							let promises = [];

							files.forEach( file => {

								promises.push(this.copy(from + Common.path.sep + file, dirPath, promises));

							});

							Promise.all(promises).then(() => {
								resolve(dirPath);
							});
						});

					});

				} else {

					this.copyFile(from, to).then( newPath => {

						resolve(newPath);

					});

				}
			});

		});

	}

	isDirectory(path){

		return new Promise((resolve, reject) => {
			fs.stat(path, (err, stat) => {
				if (err){ reject(err); }
				resolve(stat.isDirectory());
			});
		});

	}

	makeDir(path, name){

		return new Promise((resolve, reject) => {

			fs.mkdir(path + Common.path.sep + name, (err) => { 
				if (err) throw err;

				resolve(path + Common.path.sep + name);

			});	

		});

	}

	copyFile(from, to){

		var fromInfo = Common.path.parse(from);

		return new Promise((resolve, reject) => {

			fs.readFile(from, (err, data) => {
				if (err) throw err;

					fs.writeFile(to + Common.path.sep + fromInfo.name + fromInfo.ext, data, (err) => {
						if (err) throw err;

						resolve(to + Common.path.sep + fromInfo.name + fromInfo.ext);

				});

			});

		})

	}

	loadAllJSON(dirPath){

		return new Promise((resolve, reject) => {

			fs.readdir(dirPath, (err, files) => {

				var promises = [];

				files.forEach( file => {

					if (file.split('.').pop() === 'json'){

						promises.push(new Promise((resolve, reject) => {

							fs.readFile(dirPath + Common.path.sep + file, 'utf8', function (err, data) {
								if (err) throw err; // we'll not consider error handling for now

								try {
									var json = JSON.parse(data);
								} catch (err){
									console.log("Error parsing JSON: " + err);
									resolve();
								}

								resolve(json);

							});

						}));

					}

				});

				Promise.all(promises).then((data) => {
					resolve(data);
				});

			});

		});

	}

	loadJSON(path){

		return new Promise((resolve, reject) => {

			fs.readFile(path, 'utf8', function (err, data) {
				if (err) throw err; // we'll not consider error handling for now

				try {

					var jsonData = JSON.parse(data);

					resolve(jsonData);

				} catch (err) {

					reject(err);

				}

			});

		});

	}

	writeAsJSON(path, fileName, object){

		var json = JSON.stringify(object);

		return new Promise((resolve, reject) => {

			fs.writeFile(path + Common.path.sep + fileName, json, 'utf8', function(err, data){

				if (err){
					reject(err);
				} else {
					resolve(true);
				}

			});

		});

	}






	/*
	copy(fromPath, toPath, callback) {

		var from = Common.path.parse(fromPath);

		return new Promise((resolve, reject) => {

			fs.stat(fromPath, (err, stat) => {
				if (err) throw err;

				//If the file to copy is a directory, make a new directory
				if (stat.isDirectory()){

					fs.mkdir(toPath + Common.path.sep + from.name, (err) => { 
						if (err) throw err;




						//if (callback){
						//	callback(toPath + Common.path.sep + from.name);
						//}
					});

				} else {

					fs.readFile(fromPath, (err, data) => {
						if (err) throw err;

							fs.writeFile(toPath + Common.path.sep + from.name + from.ext, data, (err) => {
								if (err) throw err;

								if (callback){
									callback(toPath + Common.path.sep + from.name + from.ext);
								}

								resolve();
						});

					});

				}

			});

		});

	}
	*/

	parsePath(path) {
		return PATH.parse(path);
	}

	getFileName(path){
		return path.split(Common.path.sep).pop();
	}

	getParentDirectory(dir){
		var split = dir.split(Common.path.sep);

		return dir.slice(0, dir.length - split[split.length - 1].length - 1);
	}



	copyDirectory(dirPath, copyPath, callback){


	}

	buildDirctory(tree, callback){


	}

}

module.exports = FileAccess;