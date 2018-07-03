
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

State.prototype.toggle = function(grid) {
	this.step ++;
	this.current_player ^= 1;
	this.load(grid);
};

function GameManager() {
	this.colors = ['red', 'blue'];
	this.anim_time = 200;
	this.UI = new UIManager();
	this.renderer = new Renderer(this.anim_time);
}

GameManager.prototype.newGame = function(size) {
	this.size = size;
	this.tiles_count = size * size;
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

GameManager.prototype.setTile = function(r, c, color, count) {
	this.grid.cells[r][c] = new Tile(color, count);
	this.renderTile(r, c);
}

GameManager.prototype.canExplode = function(r, c) {
	return this.getTile(r, c).count > this.getLimit(r, c);
};

GameManager.prototype.addTile = function(r, c, color) {
	let tile = this.getTile(r, c);
	++tile.count;
	tile.color = color;
	let flag = this.canExplode(r, c);
	if (flag) {
		tile.count = 1;
	}
	this.renderTile(r, c);
	return flag;
};

GameManager.prototype.clickTile = function(r, c) {

	if (this.grid.cells[r][c].color != this.state.current_player) return;

	let self = this;
	const cp = this.state.current_player;
	let win = false;

	if (this.addTile(r, c, cp)) {

		let current = [[r, c]], next = [];
		const vectors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
		let bombed = [], bombed_cnt = 0;

		for (let i = 0; i < this.size; ++i) {
			let arr = [];
			for (let j = 0; j < this.size; ++j) {
				arr.push(false);
			}
			bombed.push(arr);
		}

		while (current.length) {
			current.forEach(function(a) {
				if (!bombed[a[0]][a[1]]) {
					bombed[a[0]][a[1]] = true;
					++bombed_cnt;
				}
				vectors.forEach(function(v) {
					let o = [a[0] + v[0], a[1] + v[1]];
					if (self.isIn(o[0], o[1]) && self.addTile(o[0], o[1], cp)) {
						next.push(o);
					}
				});
			});
			if (bombed_cnt >= this.tiles_count) {
				win = true;
				break;
			}
			current = next;
			next = [];
		}
	}

	this.state.toggle(this.grid);
	this.UI.update(this.state);

	if (this.state['tiles_' + this.colors[cp]] === this.tiles_count) win = true;

	if (win) {
		this.UI.showMessage(true, this.colors[cp]);
	}
};
