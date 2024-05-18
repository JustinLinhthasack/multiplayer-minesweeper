const Minesweeper = require("./minesweeper");
const { socketSendString, socketParseString } = require("./util");

class Session {
    #creator = null;
    #minesweeper = null;
    #playerBoard = null; // This is the spots the players can actually see (tiles they already interacted with)

    #blacklist = [];
    #players = [];

    constructor(creator) {
        this.#creator = creator
    }

    initGame() {
        this.#minesweeper = new Minesweeper(25,25);
    }

    connectPlayer(socket) {
        socket.on('data', (data) =>{
            console.log(socketParseString(data));
            socket.write(socketSendString("Hello this is a test!"))
        })

        socket.on('error', ()=>{
            this.disconnectPlayer(socket);
        });
        socket.on('close', ()=>{
            this.disconnectPlayer(socket);
        });

    }

    disconnectPlayer(socket) {
        console.log('player error!')

        socket.end();
    }

    kickPlayer(initiator, victim) {
        if (initiator != this.#creator) {
            return false;
        }

        // disconnect the victim's connection and relocate them to home page, prevent reconnection by adding them to the blacklist.

        return true;
    }
}

module.exports = Session