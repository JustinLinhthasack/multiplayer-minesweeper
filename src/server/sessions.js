const Minesweeper = require("./minesweeper");
const { socketParseJSON, socketSendJSON } = require("./util");

class Session {
    #creator = null;
    #minesweeper = null;
    #playerBoard = null; // This is the spots the players can actually see (tiles they already interacted with)

    #blacklist = [];
    #players = [];

    constructor(creator) {
        this.#creator = creator;
    }

    initGame() {
        this.#minesweeper = new Minesweeper(25,25);
    }

    connectPlayer(socket) {
        let index = this.#players.push(socket) - 1;
        console.log(index)
        socket.on('data', (data) =>{
            let parsedJSON = socketParseJSON(data);
            if (!parsedJSON) {
                this.disconnectPlayer(socket);
                return;
            }

            parsedJSON.data.playerId = index;

            for (i = 0; i < this.#players.length; i++) {
                if (i == index || this.#players[i] === null) {
                    continue;
                }


                this.#players[i].write(socketSendJSON(parsedJSON));
            } 
        });

        socket.on('error', ()=>{
            this.disconnectPlayer(socket, index);
        });
        socket.on('close', ()=>{
            this.disconnectPlayer(socket, index);
        });

    }

    disconnectPlayer(socket, index) {
        if (socket.destroying) {
            // socket.destroying doesn't exist outside of our use case for any onlookers, this is to make sure we only cleanup this player once.
            // I could have also checked if they already been removed from the array, but I felt this was more relevant and made more sense.
            return; 
        }
        socket.destroying = true;
        this.#players[index] = null;
        //console.log(this.#players)

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