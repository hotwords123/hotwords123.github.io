
'use strict';

let UIManager = (function() {

	function ui(Game) {
		this.Game = Game;
		this.init();
		this.initOptionsManager();
		this.initListeners();
		this.update(null);
	}

	function uiom(Game) {
		this.Game = Game;
		this.init();
		this.initListeners();
	}

	ui.prototype.init = function() {
		this.$message = $('.game-message');
		this.$message_win = $('.game-win-message');
		this.$message_win_title = $('.game-win-title');
		this.$message_win_text = $('.game-win-text');
		this.$scores_step = $('.scores-step');
		this.$scores_red = $('.scores-red');
		this.$scores_blue = $('.scores-blue');
		this.$newgame_btn = $('.newgame-btn');
	};

	ui.prototype.initOptionsManager = function() {
		this.optionsManager = new uiom(this.Game);
	};

	ui.prototype.initListeners = function() {
		let self = this;
		this.$newgame_btn.click(function() {
			self.Game.clearState();
		});
		$(document).keydown(function(e) {
			// Cinema Mode: Ctrl+Alt+Q
			if (e.which === 81 && e.ctrlKey && e.altKey) {
				self.Game.switchCinemaMode();
			}
		});
	};

	ui.prototype.update = function(state) {
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

	ui.prototype.showMessage = function(isWin, param) {
		this.$message.fadeIn(250);
		if (isWin) {
			this.optionsManager.hide();
			this.$message_win.show();
			if (this.Game.AI_count === 1) {
				if (this.Game.players[param].type === 'human') {
					this.$message_win_title.text('Congratulations!');
					this.$message_win_text.text('You won!');
				} else {
					this.$message_win_title.text('Oops!');
					this.$message_win_text.text('You lose!');
				}
			} else {
				this.$message_win_title.text('Congratulations!');
				this.$message_win_text.text('The ' + this.Game.colors[param] + ' one won!');
			}
		} else {
			this.$message_win.hide();
			this.optionsManager.show();
		}
	};

	ui.prototype.on_start = function() {
		this.$message.fadeOut(250);
	};

	uiom.prototype.init = function() {
		this.$container = $('.game-options-container');
		this.$player_0 = $('.game-player-btn-0');
		this.$player_1 = $('.game-player-btn-1');
		this.$size_minus = $('.game-size-minus');
		this.$size_plus = $('.game-size-plus');
		this.$size_text = $('.game-size-text');
		this.$start_btn = $('.game-start-btn');
		this.current_size = 8;
		this.current_players = [0, 0];
		this.player_type_desc = {
			'human': 'Player',
			'AI': 'AI'
		};
		this.update();
	};

	uiom.prototype.initListeners = function() {
		let self = this;
		this.$player_0.click(function() {
			if (++self.current_players[0] === self.Game.player_types.length) {
				self.current_players[0] = 0;
			}
			self.update();
		});
		this.$player_1.click(function() {
			if (++self.current_players[1] === self.Game.player_types.length) {
				self.current_players[1] = 0;
			}
			self.update();
		});
		this.$size_minus.click(function(e) {
			self.current_size -= e.shiftKey ? 1 : 2;
			if (self.current_size < 2) self.current_size = 2;
			self.update();
		});
		this.$size_plus.click(function(e) {
			self.current_size += e.shiftKey ? 1 : 2;
			if (self.current_size > 24) self.current_size = 24;
			self.update();
		});
		this.$start_btn.click(function() {
			let obj = {};
			self.hide();
			obj.players = [];
			obj.players[0] = self.Game.player_types[self.current_players[0]];
			obj.players[1] = self.Game.player_types[self.current_players[1]];
			self.Game.newGame(self.current_size, obj);
		});
	};

	uiom.prototype.show = function() {
		this.$container.fadeIn(250);
	};

	uiom.prototype.hide = function() {
		this.$container.hide();
	};

	uiom.prototype.getPlayerDesc = function(id) {
		let name = this.Game.player_types[id];
		return this.player_type_desc[name] || name;
	};

	uiom.prototype.update = function() {
		this.$size_text.text(this.current_size);
		this.$player_0.text(this.getPlayerDesc(this.current_players[0]));
		this.$player_1.text(this.getPlayerDesc(this.current_players[1]));
	};

	return ui;

})();

