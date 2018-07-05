
'use strict';

function LocalStorageManager() {
	this.key_state = 'NumberBomber_gameState';
	this.version = '1.0';
}

LocalStorageManager.prototype.get = function() {
	try {
		let val = localStorage.getItem(this.key_state);
		if (!val) return null;
		return this.parse(val);
	} catch (err) {
		return null;
	}
};

LocalStorageManager.prototype.clear = function() {
	localStorage.removeItem(this.key_state);
};

LocalStorageManager.prototype.save = function(state, grid) {
	try {
		localStorage.setItem(this.key_state, this.make(state, grid));
	} catch (err) {}
};

LocalStorageManager.prototype.make = function(state, grid) {
	let res = {};
	res.version = this.version;
	res.grid = grid;
	res.state = state;
	return JSON.stringify(res);
};

LocalStorageManager.prototype.parse = function(str) {
	let obj = JSON.parse(str);
	if (obj.version != this.version) {
		throw new Error("LocalStorageParseError: versions don't match");
	}
	let res = {};
	res.grid = obj.grid;
	res.state = obj.state;
	return res;
};
