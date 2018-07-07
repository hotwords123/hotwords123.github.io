

'use strict';

function Player(type, reacter, color) {
	this.type = type;
	this.reacter = new reacter(color);
}

Player.prototype.require_act = function(...arg) {
	this.reacter.react(...arg);
};

Player.prototype.release = function() {
	if (this.reacter.release) {
		this.reacter.release();
	}
};