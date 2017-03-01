class ToolbarView {

	constructor(){
		this.events = new CallbackManager();

		this.gridOn = false;
		this.gridBtn = document.getElementById("btn-grid");
		this.gridBtn.addEventListener('click', function(event){

			if (this.gridOn){
				this.gridBtn.style.backgroundColor = "white";
				this.gridOn = false;
			} else {
				this.gridBtn.style.backgroundColor = "lightblue";
				this.gridOn = true;
			}

			this.events.trigger('gridToggled');
		}.bind(this));

		this.scaleOn = false;
		this.scaleBtn = document.getElementById("btn-scale");
		this.scaleBtn.addEventListener('click', function(event){

			if (this.scaleOn){
				this.scaleBtn.style.backgroundColor = "white";
				this.scaleOn = false;
			} else {
				this.scaleBtn.style.backgroundColor = "lightblue";
				this.scaleOn = true;
			}

			this.events.trigger('scaleToggled');
		}.bind(this));

		document.getElementById('btn-origin').addEventListener('click', function(){
			this.events.trigger('goToOrigin');
		}.bind(this));


	}




}