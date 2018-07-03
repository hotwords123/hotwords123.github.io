
'use strict';

function Renderer(anim_time) {
	this.$grid_container = $('.grid-container');
	this.anim_time = anim_time;
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
			cell.$cell.attr('data-pos', [i, j].join(','));
			row.$row.append(cell.$cell.append(cell.$cell_inner));
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
	cell.$cell_inner.prop('className', `grid-cell-inner tile-${Game.colors[tile.color]} tile-${tile.count}`);
};
