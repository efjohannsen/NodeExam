//socket til serveren.
const socket = io("http://localhost:3000");

// funktion der kaldes ved event, data sendes med fra serveren.
socket.on("chat-message", data => {
    console.log(data);
});