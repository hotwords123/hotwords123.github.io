
'use strict';

function Renderer(Game) {
	this.Game = Game;
	this.cinema_mode = false;
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
	this.updateContainerClass();
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

Renderer.prototype.getTextSize = function() {
	if (this.size >= 22) return 'tiny';
	if (this.size >= 16) return 'small';
	if (this.size >= 8) return 'middle';
	return 'large';
};

Renderer.prototype.updateContainerClass = function() {
	let classes = ['grid-container'];
	classes.push('text-' + (this.cinema_mode ? 'hidden' : this.getTextSize()));
	this.$grid_container.prop('className', classes.join(' '));
};

Renderer.prototype.setCinemaMode = function(flag) {
	this.cinema_mode = flag;
	this.updateContainerClass();
};
