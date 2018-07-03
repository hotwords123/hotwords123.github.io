
'use strict';

let Game;

$(document).ready(function() {
	Game = new GameManager();
	Game.checkStorage();
});
