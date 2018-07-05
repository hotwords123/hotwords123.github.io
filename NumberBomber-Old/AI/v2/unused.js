

AI.prototype.getDangerousTileCount = function(grid, me) {

	const vectors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
	let vis = [];
	let size = grid.size;
	let max_cnt = 0;

	for (let i = 0; i < size; ++i) {
		let arr = [];
		for (let j = 0; j < size; ++j) {
			arr.push(false);
		}
		vis.push(arr);
	}

	grid.enumTiles(function(tile, i, j) {
		if (!vis[i][j] && tile.color !== me && grid.isAlarmed(i, j)) {
			let able = false;
			vectors.forEach(function(v) {
				let o = [i + v[0], j + v[1]];
				if (grid.isIn(o[0], o[1])) {
					let dest = grid.cells[o[0]][o[1]];
					if (dest.color === me && grid.isAlarmed(o[0], o[1])) {
						able = true;
					}
				}
			});
			if (able) {
				let cnt = 0, queue = [[i, j]], next = [];
				while (queue.length) {
					queue.forEach(function(a) {
						if (vis[a[0]][a[1]]) return;
						vis[a[0]][a[1]] = true;
						++cnt;
						vectors.forEach(function(v) {
							let x = a[0] + v[0], y = a[1] + v[1];
							if (grid.isIn(x, y) && !vis[x][y] && grid.isAlarmed(x, y)) {
								next.push([x, y]);
							}
						});
					});
					queue = next;
					next = [];
				}
				if (cnt > max_cnt) max_cnt = cnt;
			}
		}
	});

	return max_cnt;
};