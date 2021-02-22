//opretter socket til serveren.
const socket = io();

//ændrer cookie til logged-in: true.
socket.on("logged-in", () => {
    document.cookie = "loggedIn=true" + ";path=/";
});

//ændrer cookie til logged-in: false.
socket.on("logged-out", () => {
    document.cookie = "loggedIn=false" + ";path=/";
});