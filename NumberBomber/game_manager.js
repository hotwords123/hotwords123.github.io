
'use strict';

function State(grid) {
	this.step = 0;
	this.current_player = 0;
	this.load(grid);
}

State.prototype.load = function(grid) {
	this.tiles_red = grid.getTileCount(0);
	this.tiles_blue = grid.getTileCount(1);
};

State.prototype.toggle = function() {
	this.step ++;
	this.current_player ^= 1;
};

function GameManager() {
	this.colors = ['red', 'blue'];
	this.anim_time = 300;
	this.UI = new UIManager();
	this.renderer = new Renderer(this.anim_time);
}

GameManager.prototype.newGame = function(size) {
	this.size = size;
	this.tiles_count = size * size;
	this.animating = false;
	this.grid = new Grid(size);
	this.state = new State(this.grid);
	this.renderer.init(this.grid);
	this.UI.on_start();
	this.UI.update(this.state);
};

GameManager.prototype.clearState = function() {
	this.grid = null;
	this.UI.update(null);
};

GameManager.prototype.getLimit = function(r, c) {
	let res = 4;
	if (r === 0 || r === this.size - 1) --res;
	if (c === 0 || c === this.size - 1) --res;
	return res;
};

GameManager.prototype.isIn = function(r, c) {
	return r >= 0 && r < this.size && c >= 0 && c < this.size;
}

GameManager.prototype.getTile = function(r, c) {
	return this.grid.cells[r][c];
}

GameManager.prototype.renderTile = function(r, c) {
	this.renderer.updateTile(r, c, this.getTile(r, c));
}

GameManager.prototype.resetTile = function(r, c) {
	let tile = this.getTile(r, c);
	tile.count -= this.getLimit(r, c);
	this.renderTile(r, c);
}

GameManager.prototype.canExplode = function(r, c) {
	return this.getTile(r, c).count > this.getLimit(r, c);
};

GameManager.prototype.addTile = function(r, c, color) {
	let tile = this.getTile(r, c);
	++tile.count;
	tile.color = color;
	this.renderTile(r, c);
	return this.canExplode(r, c);
};

GameManager.prototype.bombTiles = function(queue, cp) {

	const vectors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
	let next = [];
	let self = this;

	queue.forEach(function(a) {
		if (!self.canExplode(a[0], a[1])) return;
		self.resetTile(a[0], a[1]);
		vectors.forEach(function(v) {
			let o = [a[0] + v[0], a[1] + v[1]];
			if (self.isIn(o[0], o[1]) && self.addTile(o[0], o[1], cp)) {
				next.push(o);
			}
		});
	});

	this.state.load(this.grid);

	if (this.state['tiles_' + this.colors[cp]] === this.tiles_count) {
		this.UI.showMessage(true, this.colors[cp]);
	} else {
		if (next.length) {
			setTimeout(function() {
				self.bombTiles(next, cp);
			}, this.anim_time);
		} else {
			this.state.toggle();
			this.animating = false;
		}
	}

	this.UI.update(this.state);
};

GameManager.prototype.clickTile = function(r, c) {

	if (this.animating || this.grid.cells[r][c].color != this.state.current_player) return;

	let self = this;
	let arr = [];
	const cp = this.state.current_player;

	if (this.addTile(r, c, cp)) {
		this.animating = true;
		setTimeout(function() {
			self.bombTiles([[r, c]], cp);
		}, this.anim_time);
	} else {
		this.state.toggle();
	}

	this.state.load(this.grid);
	this.UI.update(this.state);
};
