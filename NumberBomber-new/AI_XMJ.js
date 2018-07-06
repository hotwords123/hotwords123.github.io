
'use strict';

let AI_XMJ = (function() {
	
function AI(color) {
	this.color = color;
}

AI.prototype.getAreaTemp = function(w, r, c) {
	
	let grid = this.current_grid, state = this.current_state;
	let sum1 = 0, sum2 = 0, cnt = 0;
	let n = grid.size;

	for (let i = Math.max(r - w, 0); i <= Math.min(r + w, n - 1); ++i) {
		let sl = Math.max(c - w + Math.abs(i - r), 0);
		let sr = Math.min(c + w - Math.abs(i - r), n - 1);
		for (let j = sl; j <= sr; ++j) {
			sum1 += grid.cells[i][j].count;
			sum2 += grid.getLimit(i, j);
			cnt ++;
		}
	}

	let res = sum1 / sum2 - grid.limitDiff(r, c) * 0.08;

	if (r > 1 && grid.cells[r - 2][c].color !== this.color) {
		res += grid.cells[r - 1][c].count * 0.03;
	}
	if (r < n - 2 && grid.cells[r + 2][c].color !== this.color) {
		res += grid.cells[r + 1][c].count * 0.03;
	}
	if (c > 1 && grid.cells[r][c - 2].color !== this.color) {
		res += grid.cells[r][c - 1].count * 0.03;
	}
	if (c < n - 2 && grid.cells[r][c + 2].color !== this.color) {
		res += grid.cells[r][c + 1].count * 0.03;
	}

	return res;
};

AI.prototype.think = function(grid, state) {

	let arr = [];

	this.current_grid = grid;
	this.current_state = state;

	for (let i = 0; i < grid.size; ++i) {
		for (let j = 0; j < grid.size; ++j) {
			if (grid.cells[i][j].color === this.color) {
				arr.push([i, j, this.getAreaTemp(2, i, j) * 100.0]);
			}
		}
	}

	this.current_grid = null;
	this.current_state = null;

	arr.sort(function(a, b) {
		return b[2] - a[2];
	});

	let ans = arr[0];

	return [ans[0], ans[1]];

};

return AI;

})();
