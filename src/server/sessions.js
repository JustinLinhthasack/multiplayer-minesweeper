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

    createGame() {
        this.#minesweeper = new Minesweeper(25,25);
        this.#minesweeper.generateMatrixFromTile(0,0)
    }

    handleMouseData(socket, parsedJSON) {
        

        parsedJSON.data.playerId = socket.playerIndex;

        for (i = 0; i < this.#players.length; i++) {
            if (i == socket.playerIndex || this.#players[i] === null) {
                continue;
            }


            this.#players[i].write(socketSendJSON(parsedJSON));
        } 
    }

    connectPlayer(socket) {
        if (this.#creator === null) {
            this.#creator = socket; // First connection should always be the one who created it as it redirects them instantly.
        }

        let index = this.#players.push(socket) - 1;
        socket.playerIndex = index;

        socket.write(socketSendJSON({
            type: "init", 
            data: {size: {x: 25, y: 25} , board: this.#minesweeper.playerBoard}
        })); // sends the current gameState.
       

        socket.on('data', (data) =>{
            let parsedJSON = socketParseJSON(data);
            if (!parsedJSON) {
                this.disconnectPlayer(socket);
                return;
            }

            switch (parsedJSON.type) {
                case 'mouse':
                    this.handleMouseData(socket, parsedJSON);
                    break;
                case 'board':
                    if (parsedJSON.data.positions) {
                        let finalResult = [];
                        for (i = 0; i < parsedJSON.data.positions.length; i++) {
                            let result = this.#minesweeper.checkTile(parsedJSON.data.positions[i][0], parsedJSON.data.positions[i][1]);

                            if (result) {
                                finalResult = finalResult.concat(result);
                            }
                        }
                        for (i = 0; i < this.#players.length; i++) {
                            this.#players[i].write(socketSendJSON({
                                type: 'board',
                                data: finalResult
                            }));
                        }
                    } else {
                        let result = this.#minesweeper.checkTile(parsedJSON.data.x, parsedJSON.data.y);
        
                        if (result) {
                            for (i = 0; i < this.#players.length; i++) {
                                this.#players[i].write(socketSendJSON({
                                    type: 'board',
                                    data: result
                                }));
                            } 
                        }
                    }
                    
                    break;
                
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