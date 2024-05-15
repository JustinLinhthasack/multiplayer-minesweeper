const Minesweeper = require("./minesweeper");

class Session {
    static currentSessions = [];

    #creator = null;
    #minesweeper = null;

    #blacklist = [];

    constructor(creator) {
        this.#creator = creator
    }

    initGame() {
        this.#minesweeper = new Minesweeper(25,25);
    }

    connectPlayer(connection) {

    }

    kickPlayer(initiator, victim) {
        if (initiator != this.#creator) {
            return false;
        }

        // disconnect the victim's connection and relocate them to home page, prevent reconnection by adding them to the blacklist.

        return true;
    }
}