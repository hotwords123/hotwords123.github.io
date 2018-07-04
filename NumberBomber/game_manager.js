
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

State.from = function(obj) {
	return Object.assign(Object.create(State.prototype), obj);
};

function GameManager() {
	this.colors = ['red', 'blue'];
	this.anim_time = 300;
	this.UI = new UIManager();
	this.renderer = new Renderer(this.anim_time);
	this.storage = new LocalStorageManager();
}

GameManager.prototype.checkStorage = function() {
	try {
		let tmp = this.storage.get();
		if (tmp) {
			this.newGame(tmp.grid.size, tmp);
		}
	} catch (err) {
		this.clearState();
	}
};

GameManager.prototype.save = function() {
	this.storage.save(this.state, this.grid);
};

GameManager.prototype.newGame = function(size, obj) {
	this.size = size;
	this.tiles_count = size * size;
	this.animating = false;
	if (obj) {
		this.grid = Grid.from(obj.grid);
		this.state = State.from(obj.state);
	} else {
		this.grid = new Grid(size);
		this.state = new State(this.grid);
	}
	this.renderer.init(this.grid);
	this.UI.on_start();
	this.UI.update(this.state);
	this.save();
};

GameManager.prototype.clearState = function() {
	this.grid = null;
	this.state = null;
	this.UI.update(null);
	this.UI.showMessage(false);
	this.storage.clear();
};

GameManager.prototype.renderTile = function(r, c) {
	this.renderer.updateTile(r, c, this.grid.cells[r][c]);
};

GameManager.prototype.increaseTile = function(r, c, color) {
	let flag = this.grid.increaseTile(r, c, color);
	this.renderTile(r, c);
	return flag;
};

GameManager.prototype.resetTile = function(r, c) {
	this.grid.resetTile(r, c);
	this.renderTile(r, c);
};

GameManager.prototype.bombTiles = function(queue, cp) {

	const vectors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
	let next = [];
	let self = this;

	if (!this.grid) return;

	queue.forEach(function(a) {
		if (!self.grid.canExplode(a[0], a[1])) return;
		self.resetTile(a[0], a[1]);
		vectors.forEach(function(v) {
			let o = [a[0] + v[0], a[1] + v[1]];
			if (self.grid.isIn(o[0], o[1]) && self.increaseTile(o[0], o[1], cp)) {
				next.push(o);
			}
		});
	});

	this.state.load(this.grid);

	if (this.state['tiles_' + this.colors[cp]] === this.tiles_count) {
		this.storage.clear();
		this.UI.showMessage(true, this.colors[cp]);
	}
	if (next.length) {
		setTimeout(function() {
			self.bombTiles(next, cp);
		}, this.anim_time);
	} else {
		this.state.toggle();
		this.animating = false;
		this.save();
	}

	this.UI.update(this.state);
};

GameManager.prototype.clickTile = function(r, c) {

	if (this.animating || this.grid.cells[r][c].color != this.state.current_player) return;

	let self = this;
	let arr = [];
	let flag;
	const cp = this.state.current_player;

	flag = this.increaseTile(r, c, cp);

	if (flag) {
		this.animating = true;
		setTimeout(function() {
			self.bombTiles([[r, c]], cp);
		}, this.anim_time);
	} else {
		this.state.toggle();
	}

	this.state.load(this.grid);

	if (!flag) this.save();

	this.UI.update(this.state);
};
