
'use strict';

function Grid(size) {
	this.size = size;
	this.cells = [];
	for (let i = 0; i < size; ++i) {
		let row = [];
		for (let j = 0; j < size; ++j) {
			row.push(new Tile((i ^ j) & 1, 1));
		}
		this.cells.push(row);
	}
}

Grid.prototype.enumTiles = function(callback) {
	this.cells.forEach(function(row, i) {
		row.forEach(function(cell, j) {
			callback(cell, i, j);
		});
	});
};

Grid.prototype.enumTilesEx = function(callback) {
	for (let i = 0; i < this.size; ++i) {
		for (let j = 0; j < this.size; ++j) {
			if (!callback(this.cells[i][j], i, j)) {
				return;
			}
		}
	}
};

Grid.prototype.getTileCount = function(color) {
	let res = 0;
	this.enumTiles(function(cell) {
		if (cell.color == color) ++res;
	});
	return res;
};

Grid.prototype.getLimit = function(r, c) {
	let res = 4;
	if (r === 0 || r === this.size - 1) --res;
	if (c === 0 || c === this.size - 1) --res;
	return res;
};

Grid.prototype.isIn = function(r, c) {
	return r >= 0 && r < this.size && c >= 0 && c < this.size;
};

Grid.prototype.canExplode = function(r, c) {
	return this.cells[r][c].count > this.getLimit(r, c);
};

Grid.prototype.isAlarmed = function(r, c) {
	return this.cells[r][c].count === this.getLimit(r, c);
};

Grid.prototype.increaseTile = function(r, c, color) {
	let tile = this.cells[r][c];
	++tile.count;
	tile.color = color;
	return this.canExplode(r, c);
};

Grid.prototype.resetTile = function(r, c) {
	let tile = this.cells[r][c];
	tile.count -= this.getLimit(r, c);
};

Grid.from = function(obj) {
	return deepClone(Grid.prototype, obj);
};

function Tile(color, count) {
	this.color = color;
	this.count = count;
}
