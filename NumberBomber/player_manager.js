
'use strict';

function Player(type, reacter, color) {
	this.type = type;
	this.color = color;
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

function HumanReacter() {
	this.$grid_container = $('.grid-container');
	this.waiting = false;
	this.addListeners();
}

HumanReacter.prototype.addListeners = function() {
	let self = this;
	this.callback = function() {
		if (!self.waiting) return;
		let pos = $(this).attr('data-pos').split(',');
		if (self.api(+pos[0], +pos[1])) {
			self.waiting = false;
		}
	};
	this.$grid_container.on('click', '.grid-cell', this.callback);
};

HumanReacter.prototype.react = function(api) {
	this.api = api;
	this.waiting = true;
};

HumanReacter.prototype.release = function() {
	this.$grid_container.off('click', '.grid-cell', this.callback);
};

function AIReacter(color) {
	this.AI = new AI(color, 250);
}

AIReacter.prototype.react = function(api, state, grid) {
	let self = this;
	setTimeout(function() {
		let res = self.AI.think(grid, state);
		api(res[0], res[1]);
	}, 300);
};