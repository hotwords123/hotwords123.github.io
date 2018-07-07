
'use strict';

let HistoryInterface = (function() {

	let current_history = null;

	function reacter(color) {
		this.color = color;
	}

	reacter.prototype.react = function(callback, state) {
		if (current_history) {
			let act = current_history.history[state.step];
			setTimeout(function() {
				callback(act[0], act[1]);
			}, 300);
		}
	};

	function setCurrentHistory(obj) {
		current_history = obj;
	}

	return {
		Reacter: reacter,
		setCurrentHistory: setCurrentHistory
	};
})();
