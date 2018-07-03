
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

Grid.prototype.getTileCount = function(color) {
	let res = 0;
	this.enumTiles(function(cell) {
		if (cell.color == color) ++res;
	});
	return res;
};

function Tile(color, count) {
	this.color = color;
	this.count = count;
}
