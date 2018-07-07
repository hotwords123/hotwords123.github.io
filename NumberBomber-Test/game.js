
'use strict';

$(document).ready(function() {
	let Game = new GameManager(
		UIManager,
		Renderer,
		LocalStorageManager,
		{
			'human': HumanReacter,
			'AI': createAIReacterClass(AI),
			'AI.v1': createAIReacterClass(AI_v1),
			'AI.v2': createAIReacterClass(AI_v1),
			'AI.XMJ': createAIReacterClass(AI_XMJ)
		});
	Game.checkStorage();
});
