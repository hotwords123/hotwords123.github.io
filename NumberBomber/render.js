
'use strict';

function Renderer(Game) {
	this.Game = Game;
	this.$grid_container = $('.grid-container');
}

Renderer.prototype.init = function(grid) {
	this.$grid_container.html('');
	this.size = grid.size;
	this.rows = [];
	for (let i = 0; i < this.size; ++i) {
		let row = {};
		row.$row = $('<div class="grid-row">');
		row.cells = [];
		for (let j = 0; j < this.size; ++j) {
			let cell = {};
			cell.$cell = $('<div class="grid-cell">');
			cell.$cell_inner = $('<div class="grid-cell-inner">');
			cell.$cell_text = $('<div class="grid-cell-text">');
			cell.$cell.attr('data-pos', [i, j].join(','));
			row.$row.append(cell.$cell.append(cell.$cell_inner.append(cell.$cell_text)));
			row.cells.push(cell);
		}
		this.rows.push(row);
		this.$grid_container.append(row.$row);
	}
	for (let i = 0; i < this.size; ++i) {
		for (let j = 0; j < this.size; ++j) {
			this.updateTile(i, j, grid.cells[i][j]);
		}
	}
};

Renderer.prototype.updateTile = function(r, c, tile) {
	let cell = this.rows[r].cells[c];
	let classes = ['grid-cell-inner'];
	let delta = this.Game.grid.getLimit(r, c) - tile.count;
	if (delta < 0) {
		classes.push('tile-bomb');
	} else {
		classes.push('tile-' + delta);
	}
	classes.push('tile-' + this.Game.colors[tile.color]);
	cell.$cell_inner.prop('className', classes.join(' '));
	cell.$cell_text.text(tile.count);
};
