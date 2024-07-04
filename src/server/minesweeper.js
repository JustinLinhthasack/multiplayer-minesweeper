// Minesweeper game logic

const TILE_TYPES = {
    FLAG: -3,
    UNSET: -2,
    BOMB: -1,
    // Any other byte is a count referencing the amount of bombs around that tile
}

class Minesweeper {
    #sizeX = 25; // Default game size
    #sizeY = 25;
    #bombPercent = .2;
    #actualBoard = [];
    #playerGame = []; // This is what the player's see
    #started = false;

    constructor(sizeHeight, sizeWidth) {
        this.#sizeX = sizeHeight;
        this.#sizeY = sizeWidth;
    }

    toString() { // for testing purposes, just prints out the game matrix in console.
        for (let x = 0; x < this.#sizeX; x++) {
            let xString = "";
            for (let y = 0; y < this.#sizeY; y++) {
                xString += this.#actualBoard[x][y] + " "
            }
            console.log(xString);
        }
    }
    
    get totalMines() {
        return (this.#sizeX * this.#sizeY) * this.#bombPercent;
    }

    get hasStarted() {
        return this.#started;
    }

    set hasStarted(bool) {
        this.#started = true;
    }

    get playerBoard() {
        return this.#playerGame;
    }

    generateMatrixFromTile(startX, startY) {

        startX = Number(startX);
        startY = Number(startY);

        if (isNaN(startX) || isNaN(startY)) {
            return false;
        }

        if ((startX >= this.#sizeX || startX < 0) || (startY >= this.#sizeY || startY < 0)) {
            return false;
        }

        for (let x = 0; x < this.#sizeX; x++) { // Initializes the matrix to unsets
            this.#actualBoard[x] = [];
            for (let y = 0; y < this.#sizeY; y++) {
                this.#actualBoard[x][y] = TILE_TYPES.UNSET;
            }
        }

        for (let i = -1; i < 2; i++) { // Sets initial 3 by 3 to 0s
            for (let j = -1; j < 2; j++) {
                if (startX + i >= this.#sizeX || startX + i < 0 || startY + j >= this.#sizeY || startY + j < 0) {
                    continue;
                }
                this.#actualBoard[startX + i][startY + j] = 0;
            }
        }

        //console.log("INITIAL BOARD");
        //this.toString();


        let amountOfBombs = this.totalMines;

        for (let bombCount = 0; bombCount < amountOfBombs; bombCount++) { // Randomizes bomb placement, ignores initial 0s and other bomb tiles
            let randomX = Math.floor(Math.random() * this.#sizeX);
            let randomY = Math.floor(Math.random() * this.#sizeY);

            let tileNumber = this.#actualBoard[randomX][randomY];

            while (tileNumber == TILE_TYPES.BOMB || tileNumber != TILE_TYPES.UNSET) { // Loops till it finds a spot to guarantee number of bombs. Not sure if there is a better algorithm. Will check when finished.
                randomX = Math.floor(Math.random() * this.#sizeX);
                randomY = Math.floor(Math.random() * this.#sizeY);

                tileNumber = this.#actualBoard[randomX][randomY];
            }

            this.#actualBoard[randomX][randomY] = TILE_TYPES.BOMB;
        }
        //console.log("BOMB PLACEMENT");
        //this.toString();

        for (let x = 0; x < this.#sizeX; x++) { // Turns all unsets to 0s and counts up all tiles surrounding bombs
            for (let y = 0; y < this.#sizeY; y++) {
                if (this.#actualBoard[x][y] == TILE_TYPES.UNSET) {
                    this.#actualBoard[x][y] = 0;
                } else if (this.#actualBoard[x][y] == TILE_TYPES.BOMB) {
                    let startX = x;
                    let startY = y;

                    for (let i = -1; i < 2; i++) { // Counts surrounding tiles up by 1
                        for (let j = -1; j < 2; j++) {

                            if (startX + i >= this.#sizeX || startX + i < 0 || startY + j >= this.#sizeY || startY + j < 0) {
                                continue;
                            }
                            let tileType = this.#actualBoard[startX + i][startY + j];
                            if (tileType == TILE_TYPES.BOMB) {
                                continue;
                            }

                            if (tileType == TILE_TYPES.UNSET) {
                                this.#actualBoard[startX + i][startY + j] = 0;
                            }
                            this.#actualBoard[startX + i][startY + j] += 1;
                        }
                    }
                }
            }
        }

        //console.log("FULL BOARD")
        //this.toString();
        return true;
    }

    toggleFlag(x, y) {
        x = Number(x);
        y = Number(y);

        if (isNaN(x) || isNaN(y)) {
            return false;
        }

        if ((x >= this.#sizeX || x < 0) || (y >= this.#sizeY || y < 0) || (this.#playerGame[x] && this.#playerGame[x][y] != null && this.#playerGame[x][y] != -3)) {
            return false;
        }

        if (!this.#playerGame[x]) {
            this.#playerGame[x] = [];
        }

        const previousTileInfo = this.#playerGame[x][y];

        if (previousTileInfo === TILE_TYPES.FLAG) {
            this.#playerGame[x][y] = null;
        } else {
            this.#playerGame[x][y] = TILE_TYPES.FLAG;
        }

        return [{ position: [x, y], tileInfo: this.#playerGame[x][y] }];
    }

    checkTile(x, y) {
        x = Number(x);
        y = Number(y);

        if (isNaN(x) || isNaN(y)) {
            return false;
        }

        if ((x >= this.#sizeX || x < 0) || (y >= this.#sizeY || y < 0) || (this.#playerGame[x] && (this.#playerGame[x][y] != null && this.#playerGame[x][y] != -3))) {
            return false;
        }

        const tile = this.#actualBoard[x][y];
        let foundTiles = [];

        if (!this.#playerGame[x]) {
            this.#playerGame[x] = [];
        }

        this.#playerGame[x][y] = tile;
        foundTiles.push({ position: [x, y], tileInfo: tile })

        if (tile === 0) {
            for (let i = -1; i < 2; i++) {
                for (let j = -1; j < 2; j++) {
                    const result = this.checkTile(x + i, y + j);
                    if (result) {
                        foundTiles = foundTiles.concat(result);
                    }
                }
            }
        }


        return foundTiles;
    }



}

module.exports = Minesweeper