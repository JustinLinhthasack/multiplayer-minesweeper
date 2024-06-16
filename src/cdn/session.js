const url = new URL(window.location.href);
const socket = new WebSocket(`ws://${url.hostname}:${url.port}${url.pathname}`);

const main = document.querySelector('main');

function handleMouseData(data) {
    let target = document.getElementById("player-" + data.playerId);
    if (target) {
        let targetX = (document.documentElement.clientWidth/2 + data.x);
        let targetY = (document.documentElement.clientHeight/2 + data.y);

        if (targetX < 0 || targetX > document.documentElement.clientWidth - 5) {
            targetX = targetX < 0 ? 0 : document.documentElement.clientWidth - 5;
        } 
        if (targetY < 0 || targetY > document.documentElement.clientHeight - 5) {
            targetY = targetY < 0 ? 0 : document.documentElement.clientHeight - 5;
        } 

        target.style.left = targetX+'px';
        target.style.top = targetY+'px';
    }

    
}

function handleCellLeftClick(cell) {
    const cellPosString = cell.target.getAttribute('data-position');
    if (cellPosString === null || cell.target.getAttribute('data-isFlagged') === 'true') {
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

function handlePlayerConnect(data) {
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

function handlePlayerDisconnect(data) {
    const playerCursor = document.getElementById('player-'+data.playerId);
    if (playerCursor) {
        playerCursor.remove();
    }
}

function handleCellRightClick(cell) {
    const cellPosString = cell.target.getAttribute('data-position');
    if (cellPosString === null || cell.target.getAttribute('data-canFlag') === 'false') {
        return;
    }

    const cellPos = cellPosString.split(',');
    const isFlagged = cell.target.getAttribute('data-isFlagged') === 'true';

    if (isFlagged) {
        cell.target.setAttribute('data-isFlagged', false);
        cell.target.textContent = '';
    } else {
        cell.target.setAttribute('data-isFlagged', true);
        cell.target.textContent = '🚩';
    }

    socket.send(JSON.stringify({
        type: 'rightclick',
        data: {x: cellPos[0], y: cellPos[1]}
    }));
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
            if (nearbyCell && nearbyCell.getAttribute('data-isFlagged') === 'true') {
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
                        cell.style.backgroundColor = 'lightgray';
                        cell.setAttribute('data-canFlag', false);
                        if (data.board[x][y] === -1) {
                            cell.textContent = '💣';
                        } else if (data.board[x][y] === -3) {
                            cell.setAttribute('data-canFlag', true);
                            cell.setAttribute('data-isFlagged', true);
                            cell.style.backgroundColor = 'rgb(143, 141, 141)';
                            cell.textContent = '🚩';
                        } else if (data.board[x][y]) { // ignores any 0s
                            cell.textContent = data.board[x][y];
                        }
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
                    } else if (data[i].tileInfo === -3) {
                        tile.setAttribute('data-isFlagged', true);
                        tile.setAttribute('data-canFlag', true);
                        tile.style.backgroundColor = 'rgb(143, 141, 141)';
                        tile.textContent = '🚩';
                    } else if (data[i].tileInfo) { // ignores any 0s
                        tile.textContent = data[i].tileInfo;
                    } else if (data[i].tileInfo === null) {
                        tile.setAttribute('data-canFlag', false);
                        tile.setAttribute('data-isFlagged', false);
                        tile.style.backgroundColor = 'rgb(143, 141, 141)';
                        tile.textContent = '';
                    }
                    
                }
            }
            
            break;
        case 'mouse':
           handleMouseData(data);
           break;
        case 'connect':
            handlePlayerConnect(data);
            break;
        case 'disconnect':
            handlePlayerDisconnect(data);
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
            x: (event.x - document.documentElement.clientWidth/2 - 2.5), // 3.5 is cursor offset.
            y: (event.y  - document.documentElement.clientHeight/2 - 2.5)
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

