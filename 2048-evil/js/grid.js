function Grid(size, previousState) {
  this.size = size;
  this.cells = previousState ? this.fromState(previousState) : this.empty();
}

// Build a grid of the specified size
Grid.prototype.empty = function () {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(null);
    }
  }

  return cells;
};

Grid.prototype.fromState = function (state) {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      var tile = state[x][y];
      row.push(tile ? new Tile(tile.position, tile.value) : null);
    }
  }

  return cells;
};

// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
  var cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  var cells = [];

  this.eachCell(function (x, y, tile) {
    if (!tile) {
      cells.push({ x: x, y: y });
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

// Move a tile and its representation
Grid.prototype.moveTile = function (tile, cell) {
  this.cells[tile.x][tile.y] = null;
  this.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

Grid.prototype.withinBounds = function (position) {
  return position.x >= 0 && position.x < this.size &&
         position.y >= 0 && position.y < this.size;
};

Grid.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.withinBounds(cell) &&
           this.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

// Save all tile positions and remove merger info
Grid.prototype.prepareTiles = function () {
  this.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

Grid.prototype.smoothness = function () {
  var result = 0;
  for (var dir = 0; dir < 2; ++dir) {
    for (var x = 0; x < this.size; ++x) {
      var numbers = [];
      for (var y = 0; y < this.size; ++y) {
        var cell = dir ? { x: y, y: x } : { x: x, y: y };
        if (this.cellOccupied(cell)) {
          var value = Math.log2(this.cellContent(cell).value);
          if (numbers.length) {
            var first = numbers[numbers.length - 1];
            var rate = Math.pow(Math.max(value, first), 0.4);
            result -= 0.4 * rate * Math.pow(Math.abs(value - first), 0.8);
            if (numbers.length > 1) {
              var second = numbers[numbers.length - 2];
              var temp = (second - first) * (second - value);
              var rate2 = Math.pow(Math.max(value, first, second), 0.4);
              if (temp > 0) {
                result -= 1.0 * rate2 * Math.pow(temp, 0.8);
              } else {
                result += 0.5 * rate2;
              }
            }
          }
          numbers.push(value);
        }
      }
    }
  }
  return result;
};

Grid.prototype.maxMerge = function () {
  var result = 0;
  for (var dir = 0; dir < 2; ++dir) {
    for (var x = 0; x < this.size; ++x) {
      var last = 0;
      for (var y = 0; y < this.size; ++y) {
        var cell = dir ? { x: y, y: x } : { x: x, y: y };
        if (this.cellOccupied(cell)) {
          var value = this.cellContent(cell).value;
          if (last && value === last && value > result) {
            result = value;
          }
          last = value;
        }
      }
    }
  }
  return result;
};

Grid.prototype.movesAvailable = function () {
  return this.cellsAvailable() || this.maxMerge() > 0;
};

Grid.prototype.serialize = function () {
  var cellState = [];

  for (var x = 0; x < this.size; x++) {
    var row = cellState[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
    }
  }

  return {
    size: this.size,
    cells: cellState
  };
};
