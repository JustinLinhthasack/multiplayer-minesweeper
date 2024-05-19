const url = new URL(window.location.href);
const socket = new WebSocket(`ws://${url.hostname}:${url.port}${url.pathname}`);


function handleServerData(type, data) {
    switch (type) {
        case 'mouse':
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
}



socket.addEventListener("open", (e) => {
    let lastUpdated = performance.now();

    addEventListener('mousemove', (event) => {
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
    });
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