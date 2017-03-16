//A series of wrapper classes for DOM elements so that they can be created with 'new' keyword and extended more easily

class HTMLElementWrapper {

	constructor(parent, type, options){

		this._element = document.createElement(type); //DOM element
		this._parent = this.setParent(parent); //DOM element's parent
		this.options(options);

		console.log(this._parent);
	}

	get self(){
		return this._element;
	}

	on(event, callback){
		this._element.addEventListenver(event, callback);
	}

	options(options){
		for (var op in options){
			if (op in this._element)
				this._element[op] = options[op];
			else if (op in this._element.style)
				this._element.style[op] = options[op];
		}
	}

	//Parent can be: DOM Element, element ID, or another instance of HTMLElementWrapper
	setParent(parent){
		if (this._parent) this._parent.removeChild(this._element);

		if (parent instanceof HTMLElementWrapper){
			this._parent = parent._element;
		}
		else if (parent instanceof HTMLElement){
			this._parent = parent;
		}
		else if (typeof parent === 'string'){
			this._parent = document.getElementById(parent);
		}
		else {
			return false;
		}

		if (this._parent){ //Check whether parent is not null, as its possible the query selection return null
			this._parent.appendChild(this._element);
			return this._parent;
		}

		return false;
	}

	getParent(){
		return this._parent;
	}

	destroy(){
		this._parent.removeChild(this._element);	
	}
}

class Input extends HTMLElementWrapper {
	constructor(parent, options){
		super(parent, 'input', options);

	}
}

var Elementary = 	{	
						HTMLElementWrapper: HTMLElementWrapper,
						Input: Input
					}

/*
class Elementary {

	template(key, )

	make(type, options){
		var el = document.createElement(type);
		this._applyOptions(el);
	}

}

Elementary.template('lest-element'{
									input: {
											 className: '.item'
										   }
									input: {

									}



					});

*/

module.exports = Elementary;