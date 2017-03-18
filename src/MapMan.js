//Create globals
var MapMan = {};
var Editor = {};

var Game = new Phaser.Game(600, 800, Phaser.WEBGL, 'mapman-canvas');

var EditorSetup = {

	preload: function(){

		this.game.load.image('handle-drag','resources/images/handle-drag.png');
		this.game.load.image('origin','resources/images/origin.png');
		this.game.load.image('mapman-default','resources/images/mapman-default.png');
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

Game.state.add('EditorSetup', EditorSetup);
Game.state.add('EventLink',  EventLink);
Game.state.start('EditorSetup');