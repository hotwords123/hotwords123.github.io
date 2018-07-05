
'use strict';

function deepClone(pt, o) {
	return Object.assign(Object.create(pt), cloneObject(o));
}

function cloneObject(o) {
	if (typeof o !== 'object') return o;
	let r;
	if (o instanceof Array) {
		r = [];
		for (let i = 0; i < o.length; ++i) {
			r.push(cloneObject(o[i]));
		}
		return r;
	}
	r = {};
	for (let i in o) {
		if (o.hasOwnProperty(i)) {
			r[i] = cloneObject(o[i]);
		}
	}
	return r;
}

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
	return deepClone(State.prototype, obj);
};

function GameManager() {
	this.colors = ['red', 'blue'];
	this.players = {};
	this.players.human = 0;
	this.players.AI = 1;
	this.anim_time = 300;
	this.UI = new UIManager();
	this.renderer = new Renderer(this.anim_time);
	this.storage = new LocalStorageManager();
	this.AI = new AI(this.players.AI, 150);
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

GameManager.prototype.newGame = function(size, obj, reverse) {
	this.size = size;
	this.tiles_count = size * size;
	this.animating = false;
	if (obj) {
		this.grid = Grid.from(obj.grid);
		this.state = State.from(obj.state);
	} else {
		this.grid = new Grid(size);
		this.state = new State(this.grid);
		if (reverse) this.state.current_player ^= 1;
	}
	this.renderer.init(this.grid);
	this.UI.on_start();
	this.UI.update(this.state);
	this.save();
	this.on_toggle();
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
	let won = false;

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
		won = true;
		this.storage.clear();
		this.UI.showMessage(true, cp === this.players.human);
	}
	if (next.length) {
		setTimeout(function() {
			self.bombTiles(next, cp);
		}, this.anim_time);
	} else if (!won) {
		this.state.toggle();
		this.on_toggle();
		this.animating = false;
		this.save();
	}

	this.UI.update(this.state);
};

GameManager.prototype.act = function(r, c) {

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
		this.on_toggle();
	}

	this.state.load(this.grid);

	if (!flag) this.save();

	this.UI.update(this.state);
};

GameManager.prototype.clickTile = function(r, c) {
	if (this.animating || this.grid.cells[r][c].color !== this.players.human) return;
	this.act(r, c);
};

GameManager.prototype.on_toggle = function() {
	if (this.state.current_player === this.players.AI) {
		let self = this;
		setTimeout(function() {
			self.require_AI();
		}, this.anim_time);
	}
};

GameManager.prototype.require_AI = function() {
	let pos = this.AI.think(Grid.from(this.grid), State.from(this.state));
	if (!pos) {
		throw new Error("AIError: position not provided")
	}
	if (this.grid.cells[pos[0]][pos[1]].color !== this.players.AI) {
		throw new Error("AIError: invalid position");
	}
	this.act(pos[0], pos[1]);
};
