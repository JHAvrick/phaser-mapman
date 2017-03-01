//Create globals
var MapMan = {};
var Editor = {};

var stage = new Phaser.Game(600, 800, Phaser.WEBGL, 'mapman-canvas');

var EditorSetup = {

	preload: function(){

		this.game.load.image('handle-drag','resources/handles/handle-drag.png');
		this.game.load.image('origin','resources/handles/origin.png');

	},

	create: function(){

		this.game.world.resize(10000, 10000);
		this.game.world.setBounds(-5000, -5000, 10000, 10000);

		this.scale.scaleMode = Phaser.ScaleManager.RESIZE;
		this.scale.pageAlignHorizontally = true;
		this.scale.pageAlignVertically = true;

		this.state.start('EventLink');
	}

}

stage.state.add('EditorSetup', EditorSetup);
stage.state.add('EventLink',  EventLink);
stage.state.start('EditorSetup');