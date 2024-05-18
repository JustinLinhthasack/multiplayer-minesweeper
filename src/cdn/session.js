const url = new URL(window.location.href);
const socket = new WebSocket(`ws://${url.hostname}:${url.port}${url.pathname}`);

socket.addEventListener("open", (e) => {
    console.log("SENDING!")
    socket.send("Hello!");
})

socket.addEventListener("message", (event) => {
    console.log("Message from server:", event.data);
  });