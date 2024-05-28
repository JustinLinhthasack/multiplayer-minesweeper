const Minesweeper = require("./minesweeper");
const { socketParseJSON, socketSendJSON } = require("./util");

class Session {
    static sessions = {};

    #creator = null;
    #minesweeper = null;
    #sessionID = null;

    #blacklist = [];
    #players = [];

    constructor(sessionID) {
        this.#sessionID = sessionID;
    }

    initGame() {
        this.#minesweeper = new Minesweeper(25,25);
    }

    connectPlayer(socket) {
        if (this.#creator === null) {
            this.#creator = socket; // First connection should always be the one who created it as it redirects them instantly.
        }

        let index = this.#players.push(socket) - 1;

        /**socket.write(socketSendJSON({
            type: "init", 
            data: {size: [25,25] , board: this.#minesweeper.playerBoard}
        })); // sends the current gameState.
        **/

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
        this.#players.splice(index, 1);
        //console.log(this.#players)

        socket.end();

        console.log(this.#players.length, this.#players)

        if (this.#players.length === 0) {
            delete Session.sessions[this.#sessionID]
        }
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