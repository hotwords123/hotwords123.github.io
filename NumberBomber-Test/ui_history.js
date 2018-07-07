
'use strict';

function HistoryUIManager(Game) {
	this.Game = Game;
}

HistoryUIManager.prototype.ready = function() {
	this.init();
	this.initDetailsManager();
	this.initListeners();
	this.update(null);
};

HistoryUIManager.prototype.init = function() {
	this.$message = $('.game-message');
	this.$message_win = $('.game-win-message');
	this.$message_win_title = $('.game-win-title');
	this.$message_win_text = $('.game-win-text');
	this.$scores_step = $('.scores-step');
	this.$scores_red = $('.scores-red');
	this.$scores_blue = $('.scores-blue');
	this.$choose_btn = $('.choose-btn');
};

HistoryUIManager.prototype.initDetailsManager = function() {
	this.detailsManager = new HistoryDetailsManager(this);
};

HistoryUIManager.prototype.initListeners = function() {
	let self = this;
	this.$choose_btn.click(function() {
		self.Game.clearState();
	});
	$(document).keydown(function(e) {
		// Cinema Mode: Ctrl+Alt+Q
		if (e.which === 81 && e.ctrlKey && e.altKey) {
			self.Game.switchCinemaMode();
		}
	});
};

HistoryUIManager.prototype.update = function(state) {
	state = state || {
		tiles_red: '-',
		tiles_blue: '-',
		step: '-'
	};
	this.$scores_red.text(state.tiles_red);
	this.$scores_blue.text(state.tiles_blue);
	this.$scores_step.text(state.step);
	if (state.current_player === 0) {
		this.$scores_red.addClass('highlight');
		this.$scores_blue.removeClass('highlight');
	} else if (state.current_player === 1) {
		this.$scores_blue.addClass('highlight');
		this.$scores_red.removeClass('highlight');
	} else {
		this.$scores_red.removeClass('highlight');
		this.$scores_blue.removeClass('highlight');
	}
};

HistoryUIManager.prototype.showMessage = function(isWin, param) {
	if (isWin) {
		this.detailsManager.hide();
		this.$message_win.show();
		this.$message_win_title.text('Game Ended');
		this.$message_win_text.text('Player ' + this.Game.colors[param] + ' won.');
	} else {
		this.$message_win.hide();
		this.detailsManager.show();
	}
	this.$message.fadeIn(250);
};

HistoryUIManager.prototype.on_start = function() {
	this.$message.fadeOut(250);
};

function HistoryDetailsManager(UI) {
	this.UI = UI;
	this.cached_history = [];
	this.selected_index = 0;
	this.player_type_desc = {
		'human': 'Player',
		'AI': 'AI'
	};
	this.init();
	this.initListeners();
	this.reload();
};

HistoryDetailsManager.prototype.init = function() {
	this.$container = $('.game-history-container');
	this.$index_text = $('.game-index-text');
	this.$index_minus = $('.game-index-minus');
	this.$index_plus = $('.game-index-plus');
	this.$info_time = $('.game-info-time');
	this.$info_duration = $('.game-info-duration');
	this.$info_players = $('.game-info-players');
	this.$info_size = $('.game-info-size');
	this.$info_result = $('.game-info-result');
	this.$btn_reload = $('.game-reload-btn');
	this.$btn_start = $('.game-start-btn');
};

HistoryDetailsManager.prototype.initListeners = function() {
	let self = this;
	this.$index_minus.click(function() {
		if (!self.cached_history.length) return;
		--self.selected_index;
		if (self.selected_index < 0) {
			self.selected_index += self.cached_history.length;
		}
		self.update();
	});
	this.$index_plus.click(function() {
		if (!self.cached_history.length) return;
		++self.selected_index;
		if (self.selected_index >= self.cached_history.length) {
			self.selected_index -= self.cached_history.length;
		}
		self.update();
	});
	this.$btn_reload.click(function() {
		self.reload();
	});
	this.$btn_start.click(function() {
		self.start();
	});
};

HistoryDetailsManager.prototype.show = function() {
	this.$container.fadeIn(250);
};

HistoryDetailsManager.prototype.hide = function() {
	this.$container.hide();
};

HistoryDetailsManager.prototype.selected = function() {
	return this.cached_history.length ? this.cached_history[this.selected_index] : null;
};

HistoryDetailsManager.prototype.reload = function() {
	this.cached_history = this.UI.Game.storage.getHistory();
	this.selected_index = 0;
	this.update();
};

HistoryDetailsManager.prototype.getPlayerDesc = function(name) {
	return this.player_type_desc[name] || name;
};

HistoryDetailsManager.prototype.fillZero = function(str, ...arg) {
	let cur = 0;
	return str.replace(/%\d/g, function(a) {
		let cnt = +a.match(/^%(\d)$/)[1];
		let tmp = arg[cur++].toString();
		while(tmp.length < cnt) tmp = '0' + tmp;
		return tmp;
	});
};

HistoryDetailsManager.prototype.formatDateTime = function(o) {
	let d = new Date();
	if (!o.end_time) return '---';
	d.setTime(o.end_time);
	return this.fillZero('%4-%2-%2 %2:%2:%2',
		d.getFullYear(), d.getMonth() + 1, d.getDate(),
		d.getHours(), d.getMinutes(), d.getSeconds());
};

HistoryDetailsManager.prototype.formatDuration = function(o) {
	let a = Math.floor((o.end_time - o.start_time) / 1000);
	if (isNaN(a)) return '---';
	let h = Math.floor(a / 3600), m = Math.floor(a / 60) % 60, s = a % 60;
	if (!h) return this.fillZero('%1:%2', m, s);
	return this.fillZero('%1:%2:%2', h, m, s);
};

HistoryDetailsManager.prototype.formatPlayers = function(o) {
	return `${this.getPlayerDesc(o.players[0])} vs ${this.getPlayerDesc(o.players[1])}`;
};

HistoryDetailsManager.prototype.formatSize = function(o) {
	return `${o.size} x ${o.size}`;
};

HistoryDetailsManager.prototype.formatResult = function(o) {
	return `${o.history.length} steps, ${this.UI.Game.colors[o.won]} won`;
};

HistoryDetailsManager.prototype.update = function() {
	if (!this.cached_history.length) {
		this.$index_text.text('(No history)');
		this.$info_time.text('-');
		this.$info_duration.text('-');
		this.$info_players.text('-');
		this.$info_size.text('-');
		this.$info_result.text('-');
	} else {
		let selected = this.selected();
		this.$index_text.text((this.selected_index + 1) + ' / ' + this.cached_history.length);
		this.$info_time.text(this.formatDateTime(selected));
		this.$info_duration.text(this.formatDuration(selected));
		this.$info_players.text(this.formatPlayers(selected));
		this.$info_size.text(this.formatSize(selected));
		this.$info_result.text(this.formatResult(selected));
	}
};

HistoryDetailsManager.prototype.start = function() {
	if (!this.cached_history.length) return;
	let selected = this.selected();
	HistoryInterface.setCurrentHistory(selected);
	this.UI.Game.newGame(selected.size, {
		players: ['__history', '__history']
	});
};
