class FormView {
	constructor(fields){
		this.fields = {};

		this.addFields(fields);
	}

	addFields(fields){
		fields.forEach((field) => {
			this.fields[field.name] = {};
			this.fields[field.name].assign = field.assign ? field.assign : 'value';
			this.fields[field.name].refresh = field.refresh ? field.refresh : function(){} ;
			this.fields[field.name].element = document.getElementById(field.id);

			if (field.onChange){
				this.fields[field.name].element.addEventListener('change', (event) => {
					field.onChange(this.getValue(field.name));
				});
			}

		});
	}

	refresh(param){
		for (var name in this.fields){
			this.assign(this.fields[name].element, this.fields[name].assign, this.fields[name].refresh(param));
		}
	}

	getValue(fieldName){
		return this.resolve(this.fields[fieldName].element, this.fields[fieldName].assign);
	}

	bundle(){
		var bundle = {};
		for (var name in this.fields){
			bundle[name] = this.getValue(name);
		}

		return bundle;
	}

	clear(){
		for (var name in this.fields){
			this.assign(this.fields[name].element, this.fields[name].assign, '');
		}
	}

	resolve(obj, path) {
	    return path.split('.').reduce(function(prev, curr) {
	        return prev ? prev[curr] : undefined
	    }, obj || self)
	}

	assign(obj, prop, value){
	    if (typeof prop === "string")
	        prop = prop.split(".");

	    if (prop.length > 1) {
	        var e = prop.shift();
	        this.assign(obj[e] =
	                 typeof obj[e] === 'object'
	                 ? obj[e]
	                 : {},
	               prop,
	               value);
	    } else
	        obj[prop[0]] = value;
	}

}

module.exports = FormView;
