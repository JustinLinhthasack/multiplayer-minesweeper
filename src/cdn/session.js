const url = new URL(window.location.href);
const socket = new WebSocket(`ws://${url.hostname}:${url.port}${url.pathname}`);

const main = document.querySelector('main');

function handleMouseData(data) {
    const target = document.getElementById("player-" + data.playerId);
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

function handleCellClick(cell) {
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
                    grid.appendChild(cell);
                }
            }

            main.appendChild(grid);

            

            break;
        case 'board':
            break;
        case 'mouse':
           handleMouseData(data);
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


socket.addEventListener("open", (e) => {
    const connecting = document.getElementById("connecting")
    connecting.remove();

    

    addEventListener('mousemove', sendMousePos);
})

socket.addEventListener('close', ()=> {
    removeEventListener('mousemove', sendMousePos)
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

main.addEventListener('click', handleCellClick);