
'use strict';

let UIManager = (function() {

	function ui() {
		this.init();
		this.initSizeManager();
		this.initListeners();
		this.update(null);
	}

	function uism() {
		this.init();
		this.initListeners();
	}

	ui.prototype.init = function() {
		this.$message = $('.game-message');
		this.$message_win = $('.game-win-message');
		this.$message_win_color = $('.game-win-color');
		this.$scores_step = $('.scores-step');
		this.$scores_red = $('.scores-red');
		this.$scores_blue = $('.scores-blue');
		this.$grid_container = $('.grid-container');
		this.$newgame_btn = $('.newgame-btn');
	};

	ui.prototype.initSizeManager = function() {
		this.sizeManager = new uism();
	};

	ui.prototype.initListeners = function() {
		let self = this;
		this.$newgame_btn.click(function() {
			Game.clearState();
		});
		this.$grid_container.on('click', '.grid-cell', function() {
			let pos = $(this).attr('data-pos').split(',');
			Game.clickTile(+pos[0], +pos[1]);
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
			this.$message_win.show();
			this.$message_win_color.text(param);
		} else {
			this.$message_win.hide();
			this.sizeManager.show();
		}
	};

	ui.prototype.on_start = function() {
		this.$message.fadeOut(250);
	};

	uism.prototype.init = function() {
		this.$container = $('.game-size-container');
		this.$btn_minus = $('.game-size-minus');
		this.$btn_plus = $('.game-size-plus');
		this.$text = $('.game-size-text');
		this.$btn = $('.game-size-btn');
		this.current_size = 8;
		this.update();
	};

	uism.prototype.initListeners = function() {
		let self = this;
		this.$btn_minus.click(function() {
			self.current_size -= 2;
			if (self.current_size < 2) self.current_size = 2;
			self.update();
		});
		this.$btn_plus.click(function() {
			self.current_size += 2;
			if (self.current_size > 16) self.current_size = 16;
			self.update();
		});
		this.$btn.click(function() {
			self.$container.hide();
			Game.newGame(self.current_size);
		});
	};

	uism.prototype.show = function() {
		this.$container.fadeIn(250);
	};

	uism.prototype.update = function() {
		this.$text.text(this.current_size);
	};

	return ui;

})();

