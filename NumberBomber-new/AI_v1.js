
'use strict';

/*
	API of AI
	AI: constructor(int color, int max_time)
	AI.think: Array(2) function(Grid grid, State state)
*/

let AI_v1 = (function() {

function SearchResult(val, pos) {
	this.val = val;
	this.pos = pos;
}

function AI(color, max_time) {
	this.color = color;
	this.max_time = max_time;
	this.values = {};
	this.values.win = 1e9;
	this.values.lose = -this.values.win;
	this.values.tile = {};
	this.values.tile.a = 2;
	this.values.tile.b = 0.8;
}

AI.prototype.checkWin = function(grid, color) {
	let res = true;
	grid.enumTilesEx(function(tile) {
		if (tile.color !== color) {
			res = false;
			return false;
		}
		return true;
	});
	return res;
};

AI.prototype.calculate = function(obj, x) {
	return obj.a * Math.pow(x, obj.b);
};

AI.prototype.evaluateFor = function(grid, me) {
	let tile_cnt = grid.getTileCount(me);
	if (tile_cnt === 0) return this.values.lose;
	if (tile_cnt === grid.size * grid.size) return this.values.win;
	let result = 0;
	result += this.calculate(this.values.tile, tile_cnt);
	return result;
};

AI.prototype.evaluate = function(grid) {
	return this.evaluateFor(grid, this.color) /*- this.evaluateFor(grid, this.color ^ 1)*/;
};

AI.prototype.simulate = function(grid, r, c) {

	const vectors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
	let res = Grid.from(grid);
	let cp = res.cells[r][c].color;
	let self = this;

	if (res.increaseTile(r, c, cp)) {

		let queue = [[r, c]], next = [];

		while (queue.length) {

			queue.forEach(function(a) {
				if (!res.canExplode(a[0], a[1])) return;
				res.resetTile(a[0], a[1]);
				vectors.forEach(function(b) {
					let c = [a[0] + b[0], a[1] + b[1]];
					if (res.isIn(c[0], c[1]) && res.increaseTile(c[0], c[1], cp)) {
						next.push(c);
					}
				});
			});

			if (this.checkWin(res, cp)) break;

			queue = next;
			next = [];
		}
	}

	return res;
};

AI.prototype.worthSearch = function(grid, r, c) {
	if (grid.getLimit(r, c) === 2) return true;
	const vectors = [
		[-1, -1, 2], [-1, 0, 3], [-1, 1, 2],
		[0, -1, 3], [0, 0, 6], [0, 1, 3],
		[1, -1, 2], [1, 0, 3], [1, 1, 2]
	];
	let tmp = 0;
	vectors.forEach(function(v) {
		let x = r + v[0], y = c + v[1];
		if (grid.isIn(x, y)) {
			tmp += (3 - grid.getLimit(x, y) + grid.cells[x][y].count) * v[2];
		} else {
			tmp += v[2];
		}
	});
	return tmp > 40;
};

AI.prototype.search = function(grid, turn, depth, alpha, beta) {

	let self = this;
	let result = null, temp, grid_new;

	if (depth <= 0) {
		return new SearchResult(this.evaluate(grid), null);
	}

	if (this.checkWin(grid, turn ^ 1)) {
		if (turn === this.color) {
			return new SearchResult(this.values.lose, null);
		} else {
			return new SearchResult(this.values.win, null);
		}
	}

	grid.enumTilesEx(function(tile, r, c) {

		if (tile.color === turn) {

			if (self.worthSearch(grid, r, c)) {

				// Try increasing this tile
				grid_new = self.simulate(grid, r, c);

				// Search the next move
				temp = self.search(grid_new, turn ^ 1, depth - 1, alpha, beta);

				if (temp) {
					if (turn === self.color) { // AI's tile, find the best situation
						if (temp.val > alpha) alpha = temp.val;
						if (!result || temp.val > result.val) {
							result = new SearchResult(temp.val, [r, c]);
						}
					} else { // Player's tile, find the worst situation
						if (temp.val < beta) beta = temp.val;
						if (!result || temp.val < result.val) {
							result = new SearchResult(temp.val, [r, c]);
						}
					}
				}
			}
		}

		// Alpha-Beta Pruning
		return alpha < beta;
	});

	return result;
};

AI.prototype.think = function(grid, state) {
	let result = null, temp, depth = 0, start_time = Date.now();
	do {
		depth += 2;
		temp = this.search(grid, this.color, depth, -Infinity, Infinity);
		if (temp) result = temp.pos;
	} while (Date.now() - start_time <= this.max_time);
	console.log('Search Depth = ' + depth);
	return result;
};

return AI;

})();