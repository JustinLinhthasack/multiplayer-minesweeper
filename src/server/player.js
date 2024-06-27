class Player {
    constructor(name, socket, color) {
        this.name = name;
        this.socket = socket;
        this.color = color;

        // If I decide to add more stats, it would come here.
    }
}

module.exports = Player