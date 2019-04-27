function GameManager(size, InputManager, Actuator, StorageManager) {
  this.size           = size; // Size of the grid
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator;

  this.startTiles     = 2;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.storageManager.clearGameState();
  this.actuator.continueGame(); // Clear the game won/lost message
  this.setup();
};

// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continueGame(); // Clear the game won/lost message
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function () {
  return this.over || (this.won && !this.keepPlaying);
};

// Set up the game
GameManager.prototype.setup = function () {
  var previousState = this.storageManager.getGameState();

  // Reload the game from a previous game if present
  if (previousState) {
    this.grid        = new Grid(previousState.grid.size,
                                previousState.grid.cells); // Reload grid
    this.score       = previousState.score;
    this.over        = previousState.over;
    this.won         = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
  } else {
    this.grid        = new Grid(this.size);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.keepPlaying = false;

    // Add the initial tiles
    this.addStartTiles();
  }

  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

// Adds an evil tile
GameManager.prototype.addEvilTile = function (lastDirection) {
  var self = this;
  if (this.grid.cellsAvailable()) {
    var vector = this.getVector(lastDirection);
    var cells = this.grid.availableCells();
    var bestCell = null, bestValue = -Infinity;

    console.groupCollapsed('addEvilTile last = ' + 'up|right|bottom|left'.split('|')[lastDirection]);

    cells.forEach(function (cell) {
      var currentValue = 0;
      var addValue;
      var positions = self.grid.findFarthestPosition(cell, vector);

      if (!self.positionsEqual(cell, positions.farthest)) {
        currentValue -= 20;
      }

      var cnt_2 = 0, neighbors = [];
      self.grid.eachCell(function (x, y, tile) {
        if (tile) {
          var distance = Math.abs(x - cell.x) + Math.abs(y - cell.y) + 1;
          if (x === cell.x) {
            var temp = 0;
            for (var y2 = Math.min(y, cell.y) + 1; y2 < Math.max(y, cell.y); ++y2) {
              if (self.grid.cellOccupied({ x: x, y: y2 })) ++temp;
            }
            if (temp < distance) {
              distance = temp;
            }
          }
          if (y === cell.y) {
            var temp = 0;
            for (var x2 = Math.min(x, cell.x) + 1; x2 < Math.max(x, cell.x); ++x2) {
              if (self.grid.cellOccupied({ x: x2, y: y })) ++temp;
            }
            if (temp < distance) {
              distance = temp;
            }
          }
          if (tile.value === 2) {
            cnt_2 += 1 / (distance + 0.5);
          }
          if (!distance) {
            neighbors.push(Math.log2(tile.value));
          }
        }
      });

      var chance_2 = Math.pow(0.3, cnt_2);
      chance_2 = Math.min(0.9, Math.max(0.05, chance_2));
      addValue = Math.random() < chance_2 ? 2 : 4;

      console.group(`add ${addValue} at ${cell.x} ${cell.y}:`);

      if (neighbors.length) {
        var sum = 0;
        neighbors.sort(function (a, b) {
          return a - b;
        });
        neighbors.forEach(function (a, i) {
          sum += a;
          if (i && a - neighbors[i - 1] <= 1) {
            currentValue += 8;
          }
        });
        currentValue += 5 * sum / (1 + neighbors.length);
      } else {
        currentValue -= 100;
      }

      var gridData = self.grid.serialize();
      var bestMoveValue = -Infinity;
      for (var dir = 0; dir < 4; ++dir) {
        var moveValue = 0;
        var newGrid = new Grid(gridData.size, gridData.cells);
        newGrid.insertTile(new Tile({ x: cell.x, y: cell.y }, addValue));
        var result = self.moveGrid(newGrid, dir);
        if (result.moved) {
          if (result.won) {
            moveValue = Infinity;
          } else {
            moveValue += 0.2 * newGrid.smoothness();
            moveValue += 0.7 * Math.log2(result.score || 1);
            moveValue += 1.1 * Math.log2(newGrid.maxMerge() || 1);
            moveValue -= 1.4 * newGrid.availableCells().length;
          }
          if (moveValue > bestMoveValue) {
            bestMoveValue = moveValue;
          }
        }
      }
      currentValue -= bestMoveValue;

      console.log(`value = ${currentValue} bestMove = ${bestMoveValue}`);
      console.groupEnd();

      if (currentValue > bestValue) {
        bestCell = {
          x: cell.x, y: cell.y, value: addValue
        };
        bestValue = currentValue;
      }
    });

    if (bestCell) {
      console.log(`insert ${bestCell.value} at ${bestCell.x}, ${bestCell.y} (value = ${bestValue})`)
      this.grid.insertTile(new Tile({ x: bestCell.x, y: bestCell.y }, bestCell.value));
    } else {
      this.addRandomTile();
    }

    console.groupEnd();
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore() < this.score) {
    this.storageManager.setBestScore(this.score);
  }

  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    this.storageManager.setGameState(this.serialize());
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(),
    terminated: this.isGameTerminated()
  });

};

// Represent the current game as an object
GameManager.prototype.serialize = function () {
  return {
    grid:        this.grid.serialize(),
    score:       this.score,
    over:        this.over,
    won:         this.won,
    keepPlaying: this.keepPlaying
  };
};

GameManager.prototype.moveGrid = function (grid, direction) {
  // 0: up, 1: right, 2: down, 3: left

  var self = this;

  var cell, tile;

  var vector        = this.getVector(direction);
  var traversals    = this.buildTraversals(vector);
  var moved         = false;
  var scoreAddition = 0;
  var wonAfterMoved = false;

  // Save the current tile positions and remove merger information
  grid.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = grid.cellContent(cell);

      if (tile) {
        var positions = grid.findFarthestPosition(cell, vector);
        var next      = grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          grid.insertTile(merged);
          grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          scoreAddition += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) wonAfterMoved = true;
        } else {
          grid.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  return {
    moved: moved,
    score: scoreAddition,
    won: wonAfterMoved
  };
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var result = this.moveGrid(this.grid, direction);

  if (result.moved) {

    if (result.won) this.won = true;
    if (result.score) this.score += result.score;

    this.addEvilTile(direction);

    if (!this.grid.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // Up
    1: { x: 1,  y: 0 },  // Right
    2: { x: 0,  y: 1 },  // Down
    3: { x: -1, y: 0 }   // Left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
