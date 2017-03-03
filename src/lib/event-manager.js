//Basic implementation of an event system to interface UI and logic
class CallbackManager {
	
	constructor(){

		this.callbacks = {};

	}

	on(key, callback, context){

		if (this.callbacks.hasOwnProperty(key)){

			var newCallback = {callback: callback, context: context, removeAfterTrigger: false};

			this.callbacks[key].push(newCallback);

		} else {

			this.callbacks[key] = [];

			var newCallback = {callback: callback, context: context, removeAfterTrigger: false};

			this.callbacks[key].push(newCallback); 
		}


	}

	addOnce(key, callback, context){

		if (this.callbacks.hasOwnProperty(key)){

			var newCallback = {callback: callback, context: context, removeAfterTrigger: true, deleteFlag: false};

			this.callbacks[key].push(newCallback);

		} else {

			this.callbacks[key] = [];

			var newCallback = {callback: callback, context: context, removeAfterTrigger: true, deleteFlag: false};

			this.callbacks[key].push(newCallback); 
		}

	}

	//Creates a new callback or adds to existing callback if the key already exists
	addCallback(key, callback, context){

		if (this.callbacks.hasOwnProperty(key)){

			var newCallback = {callback: callback, context: context};

			this.callbacks[key].push(newCallback);

		} else {

			this.callbacks[key] = [];

			var newCallback = {callback: callback, context: context};

			this.callbacks[key].push(newCallback); 
		}


	}

	removeAll(key){
		if (this.callbacks.hasOwnProperty(key)){
			this.callbacks[key] = [];
		}
	}

	
	trigger(key){
		
		//Get all arguments after the first to be applied to the callback
		var args = Array.prototype.slice.call(arguments, 1);

		if (this.callbacks.hasOwnProperty(key)){
			
			for (var i = 0; i < this.callbacks[key].length; i++){

				var callback = this.callbacks[key][i].callback;
				var context =  this.callbacks[key][i].context;
				
				if (this.callbacks[key][i].removeAfterTrigger){
					this.callbacks[key].splice(i, 1);
				}

				return callback.apply(context, args);

			}
			
		}

	}

}

module.exports = CallbackManager;