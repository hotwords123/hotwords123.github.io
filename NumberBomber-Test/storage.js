
'use strict';

function LocalStorageManager(Game) {
	this.key_state = 'NumberBomberAI_v2_gameState';
	this.key_history = 'NumberBomberAI_v2_history';
	this.version = '2.1';
	this.version_history = '1.0';
	this.history_mode = false;
	this.Game = Game;
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
	if (this.history_mode) return;
	localStorage.removeItem(this.key_state);
};

LocalStorageManager.prototype.save = function() {
	if (this.history_mode) return;
	try {
		localStorage.setItem(this.key_state, this.make());
	} catch (err) {}
};

LocalStorageManager.prototype.make = function() {
	let res = {};
	res.version = this.version;
	res.grid = this.Game.grid;
	res.state = this.Game.state;
	res.players = [];
	res.players[0] = this.Game.players[0].type;
	res.players[1] = this.Game.players[1].type;
	res.history = this.Game.history;
	return JSON.stringify(res);
};

LocalStorageManager.prototype.parse = function(str) {
	let obj = JSON.parse(str);
	if (obj.version != this.version) {
		throw new Error("LocalStorageParseError: versions don't match");
	}
	return obj;
};

LocalStorageManager.prototype.saveHistory = function(won) {
	if (this.history_mode) return;
	let obj = {};
	obj.version = this.version_history;
	obj.won = won;
	obj.size = this.Game.size;
	obj.start_time = this.Game.start_time;
	obj.end_time = Date.now();
	obj.players = [];
	obj.players[0] = this.Game.players[0].type;
	obj.players[1] = this.Game.players[1].type;
	obj.history = this.Game.history;
	let arr = null;
	try {
		arr = JSON.parse(localStorage.getItem(this.key_history));
	} catch (err) {}
	if (!arr || !(arr instanceof Array)) arr = [];
	arr.push(obj);
	try {
		localStorage.setItem(this.key_history, JSON.stringify(arr));
	} catch (err) {}
};

LocalStorageManager.prototype.getHistory = function() {
	try {
		let arr = JSON.parse(localStorage.getItem(this.key_history));
		return arr && arr instanceof Array ? arr : [];
	} catch (err) {
		return [];
	}
};
