class ListView {
	constructor(containerId, styleSelector){
		this.container = document.getElementById(containerId);
		this.styleSelector = styleSelector;

		this._items = new Map();

		this.options = 	{
							sortable: false, //Whether the items can be sorted or not
							autoHeader: true, //Automatically create a header if one is specified in the item options
						};

		this.positionFlags = 	{	
									first: 
									after:
									before:
									last:
								}
	}

	set sortable(bool) {
		$(this.container).sortable();
		this.options.sortable = true;
	}

	clear(){
		while (this.container.firstChild) {
			this.container.removeChild(this.container.firstChild);
		}
		this._items.clear();
	}

	item(key, options){
		let position = options.position ? options.position: 'last';
		let position.element = options.position.element ? options.position.element : this.container.lastChild;
		let removable = options.removable ? options.removable : true;
		let styleSelector = options.styleSelector ? options.styleSelector : this.styleSelector;
		let createModifier = options.createModifier ? options.createModifier : function() {};

		let item = {};
			item.element = document.createElement('li');
			item.element.className = styleSelector;

			createModifier(item); //Call the modifier functions

		this._items.set(key, item);
		this._addAtPosition(item, position, position.element);
	}

	//Adds the passed element to the DOM container element in the specified position, used internally
	_addAtPosition(elementToAdd, position, relativeElement){
		switch (position){
			case 'first':
					this.container.insertBefore(elementToAdd, this.container.firstChild);
				break;
			case 'before':
					this.container.insertBefore(elementToAdd, relativeElement);
				break;
			case 'after':
					this.container.insertAfter(elementToAdd, relativeElement);
				break;
			case 'last':
					this.container.appendChild(elementToAdd);
				break;
		}
	}

	remove(key){
		this._items.get(key).element.parentNode.removeChild(item.element);
		this._items.delete(key);
	}


}

module.exports = ListView;