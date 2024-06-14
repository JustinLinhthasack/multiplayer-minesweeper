const url = new URL(window.location.href);
const socket = new WebSocket(`ws://${url.hostname}:${url.port}${url.pathname}`);

const main = document.querySelector('main');

function handleMouseData(data) {
    let target = document.getElementById("player-" + data.playerId);
    if (!target) {
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.width = "10px";
        div.style.height = "10px";
        div.style.backgroundColor = "rgb(0,0,0)";
        div.style.borderRadius = '50%';
        div.id = "player-"+data.playerId;
        target = div;
        document.getElementById("mouseArea").appendChild(div);
    }

    target.style.left = data.x+'px';
    target.style.top = data.y+'px';
}

function handleCellLeftClick(cell) {
    const cellPosString = cell.target.getAttribute('data-position');
    if (cellPosString === null) {
        return;
    }

    const cellPos = cellPosString.split(',');

    socket.send(JSON.stringify({
        type: 'board', 
        data: {
            x: cellPos[0],
            y: cellPos[1]
        }
    }));
}

function handleCellRightClick(cell) {
    const cellPosString = cell.target.getAttribute('data-position');
    if (cellPosString === null || cell.target.getAttribute('data-canFlag') === 'false') {
        return;
    }

    const isFlagged = cell.target.getAttribute('data-isFlagged') === 'true';

    if (isFlagged) {
        cell.target.setAttribute('data-isFlagged', false);
        cell.target.textContent = '';
    } else {
        cell.target.setAttribute('data-isFlagged', true);
        cell.target.textContent = '🚩';
    }

    
}

function handleCellMiddleClick(cell) {
    const cellPosString = cell.target.getAttribute('data-position');
    if (cellPosString === null || cell.target.getAttribute('data-isFlagged') === 'true' || cell.target.getAttribute('data-canFlag') === 'true') {
        return;
    }

    const cellPos = cellPosString.split(',');

    let pos = [];
    let flagCount = 0;
    for (let i = -1; i < 2; i++) { 
        for (let j = -1; j < 2; j++) {
            const nearbyCell = document.querySelector(`[data-position="${(+cellPos[0] + i) + ',' + (+cellPos[1] + j)}"]`)
            if (nearbyCell.getAttribute('data-isFlagged') === 'true') {
                flagCount++;
            }
            if (nearbyCell && nearbyCell.getAttribute('data-canFlag') === 'true' && nearbyCell.getAttribute('data-isFlagged') != 'true') {
                
                pos.push([+cellPos[0] + i, +cellPos[1] + j]);
            }
        }
    }

    if (flagCount < cell.target.textContent) {
        return;
    }
    socket.send(JSON.stringify({
        type: 'board',
        data: {positions: pos}
    }));
}


function handleServerData(type, data) {
    switch (type) {
        case 'init':
            const xSize = data.size.x;
            const ySize = data.size.y;

            const grid = document.createElement("div");
            grid.id = "grid";
            grid.style.width = xSize * 25 + 24 + 'px'
            grid.style.height = ySize * 25 + 24 + 'px'
            grid.style.gridTemplateRows = `repeat(${ySize}, 1fr)`;
            grid.style.gridTemplateColumns = `repeat(${xSize}, 1fr)`;
        
            for (x = 0; x < xSize; x++) {
                for (y = 0; y < ySize; y++) {
                    const cell = document.createElement('div');
                    cell.setAttribute('data-position', `${x + ',' + y}`);
                    cell.style.width = '25px';
                    cell.style.height = '25px';
                    if (data.board[x] && data.board[x][y] != null) {
                        cell.textContent = data.board[x][y];
                    } else {
                        cell.setAttribute('data-canFlag', true);
                    }
                    grid.oncontextmenu = (e) => {
                        e.preventDefault();
                    }
                    grid.appendChild(cell);
                }
            }

            main.appendChild(grid);

            

            break;
        case 'board':
            for (i = 0; i < data.length; i++) {
                const tile = document.querySelector(`[data-position="${data[i].position[0] + ',' + data[i].position[1]}"]`)
                if (tile) {
                    tile.style.backgroundColor = 'lightgray';
                    tile.setAttribute('data-canFlag', false);
                    if (data[i].tileInfo === -1) {
                        tile.textContent = '💣';
                    } else if (data[i].tileInfo) { // ignores any 0s
                        tile.textContent = data[i].tileInfo;
                    }
                    
                }
            }
            
            break;
        case 'mouse':
           handleMouseData(data);
           break;
        case 'disconnect':

            break;
        default:
            warn("Something wrong occured on the server!");
    }
}

let lastUpdated = performance.now();
function sendMousePos(event) {
    if (performance.now() - lastUpdated <= 25) {
        return;
    }
    lastUpdated = performance.now();

    socket.send(JSON.stringify({
        type: 'mouse', 
        data: {
            x: event.x,
            y: event.y
        }
    }));
}

function handleMouseDown(e) {
    if (e.button === 0) {
        handleCellLeftClick(e);
    } else if (e.button === 2) {
        handleCellRightClick(e);
    } else if (e.button === 1) {
        handleCellMiddleClick(e);
    }
}


socket.addEventListener("open", (e) => {
    const connecting = document.getElementById("connecting")
    connecting.remove();

    
    main.addEventListener('mousedown', handleMouseDown);
    addEventListener('mousemove', sendMousePos);
})

socket.addEventListener('close', ()=> {
    removeEventListener('mousemove', sendMousePos);
    main.removeEventListener('mousedown', handleMouseDown);
})

socket.addEventListener("message", (event) => {
    try {
        const parsedData = JSON.parse(event.data);

        if (!parsedData.type || !parsedData.data) {
            console.log("Invalid JSON format sent from the server. Missing either type or data.");
            return;
        }

        handleServerData(parsedData.type, parsedData.data);
    } catch(err) {
        console.log("Invalid data sent from the server.", err);
    }
});

