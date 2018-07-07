
'use strict';

$(document).ready(function() {
	let Game = new GameManager(
		HistoryUIManager,
		Renderer,
		LocalStorageManager,
		{
			'__history': HistoryInterface.Reacter
		});
	Game.storage.history_mode = true;
	Game.UI.ready();
});
