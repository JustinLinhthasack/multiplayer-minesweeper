const url = new URL(window.location.href);
const socket = new WebSocket(`ws://${url.hostname}:${url.port}${url.pathname}`);

socket.addEventListener("open", (e) => {
    socket.send("hello");
})

socket.addEventListener("message", (event) => {
    console.log("Message from server ", event.data);
  });