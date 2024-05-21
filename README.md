# Multiplayer Minesweeper

This project is minesweeper but instead of playing alone, you and three other people can work on a single board! This allows for larger minesweeper boards for more fun.

How To Play:
1. Create a session
2. Press anywhere on the grid to start your game, the first click is guaranteed to be a zero.
3. The numbers represents how many mines are touching that square, your goal is to click on guaranteed non-mines using logic and patterns.

Controls:<br>
Left click to reveal the plate<br>
Right click to flag the plate for potential bombs<br>
Middle click to reveal all surrounding plates besides flagged plates.


Tech Stack:<br>
frontend -> html, css, javascript<br>
backend -> NodeJS

The goal is to use as little libraries or plugins to get a further understanding how each piece works without relying on an established library.

This project is meant solely for learning hence the lack of libraries, in a real world scenario, I would cater towards using established and tested libraries to speed up development if needed.

## Getting Started
To get a local copy running your own system, follow these steps:


Clone the repo
```sh
git clone https://github.com/your_username_/multiplayer-minesweeper.git
```

Move your current directory into the newly created folder.
```sh
cd multiplayer-minesweeper
```

Then run the server
```sh
node ./src/server/server.js
```


You're all setup, now go to localhost:3000 and play minesweeper on LAN!