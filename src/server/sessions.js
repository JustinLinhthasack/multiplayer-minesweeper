const Minesweeper = require("./minesweeper");
const crypto = require('node:crypto');
const Player = require('./player.js');
const { socketParseJSON, socketSendJSON } = require("./util");

class Session {
    static sessions = {};

    #creator = null;
    #minesweeper = null;
    #sessionID = null;

    #blacklist = [];
    #players = {};

    #numOfPlayers = 0;

    constructor(sessionID) {
        this.#sessionID = sessionID;
    }

    createGame() {
        this.#minesweeper = new Minesweeper(25, 25);
    }

    handleMouseData(socket, parsedJSON) {


        parsedJSON.data.playerId = socket.identifier;

        for (let identifier in this.#players) {
            const player = this.#players[identifier];
            if (socket == player.socket) {
                continue;
            }
            player.socket.write(socketSendJSON(parsedJSON));
        }

    }

    connectPlayer(socket, name) {
        if (this.#numOfPlayers >= 4) {
            socket.end();
            return;
        }

        if (this.#creator === null) {
            this.#creator = socket; // First connection should always be the one who created it as it redirects them instantly.
        }

        let newidentifier = crypto.randomUUID();
        socket.identifier = newidentifier
        this.#numOfPlayers++;
        this.#players[newidentifier] = new Player(name, socket)


        socket.write(socketSendJSON({
            type: "init",
            data: { size: { x: 25, y: 25 }, board: this.#minesweeper.playerBoard }
        })); // sends the current gameState.


        socket.on('data', (data) => {
            let parsedJSON = socketParseJSON(data);
            if (!parsedJSON) {
                this.disconnectPlayer(socket);
                return;
            }

            switch (parsedJSON.type) {
                case 'rightclick':
                    let result = this.#minesweeper.toggleFlag(parsedJSON.data.x, parsedJSON.data.y);
                    if (result) {
                        for (let identifier in this.#players) {

                            const player = this.#players[identifier];
                            if (socket === player.socket) {
                                continue; // Already updated on their client.
                            }

                            player.socket.write(socketSendJSON({
                                type: 'board',
                                data: result
                            }));
                        }
                    }

                    break;
                case 'mouse':
                    this.handleMouseData(socket, parsedJSON);
                    break;
                case 'board':
                    if (!this.#minesweeper.hasStarted) {
                        this.#minesweeper.hasStarted = true;

                        let result = this.#minesweeper.generateMatrixFromTile(parsedJSON.data.x, parsedJSON.data.y)
                        if (!result) {
                            this.disconnectPlayer(socket);
                            return;
                        }
                    }

                    if (parsedJSON.data.positions) {
                        let finalResult = [];
                        for (i = 0; i < parsedJSON.data.positions.length; i++) {
                            let result = this.#minesweeper.checkTile(parsedJSON.data.positions[i][0], parsedJSON.data.positions[i][1]);

                            if (result) {
                                finalResult = finalResult.concat(result);
                            }
                        }
                        for (let identifier in this.#players) {

                            const player = this.#players[identifier];
                            player.socket.write(socketSendJSON({
                                type: 'board',
                                data: finalResult
                            }));
                        }
                    } else {
                        let result = this.#minesweeper.checkTile(parsedJSON.data.x, parsedJSON.data.y);

                        if (result) {
                            for (let identifier in this.#players) {
                                const player = this.#players[identifier];
                                player.socket.write(socketSendJSON({
                                    type: 'board',
                                    data: result
                                }));
                            }
                        }
                    }

                    break;

            }

        });

        socket.on('error', () => {
            this.disconnectPlayer(socket);
        });
        socket.on('close', () => {
            this.disconnectPlayer(socket);
        });

        for (let identifier in this.#players) {
            const player = this.#players[identifier];
            if (identifier != newidentifier) { // Sends the person connecting everyone elses data
                socket.write(socketSendJSON({ type: 'connect', data: { playerId: identifier, displayName: player.name, wins: 0, bombs: 0 } }))
            }

            // Tells everyone of the new player
            
            const newPlayer = this.#players[newidentifier];
            player.socket.write(socketSendJSON({ type: 'connect', data: { playerId: newidentifier, displayName: newPlayer.name, wins: 0, bombs: 0 } }))
        }

    }

    disconnectPlayer(socket) {
        if (socket.destroying) {
            // socket.destroying doesn't exist outside of our use case for any onlookers, this is to make sure we only cleanup this player once.
            // I could have also checked if they already been removed from the array, but I felt this was more relevant and made more sense.
            return;
        }
        socket.destroying = true;
        for (let identifier in this.#players) {
            const player = this.#players[identifier];
            if (socket == player.socket) {
                continue;
            }
            player.socket.write(socketSendJSON({ type: 'disconnect', data: { playerId: socket.identifier } }));
        }

        this.#numOfPlayers--;
        delete this.#players[socket.identifier];

        socket.end();

        for (let identifier in this.#players) { // If found, we just return.
            return;
        }

        delete Session.sessions[this.#sessionID]
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