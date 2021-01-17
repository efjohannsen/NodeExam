//opretter socket til serveren.
const socket = io();

//sender brugerens navn til serveren.
function newUser() {
    socket.emit("new-user", document.getElementById("username").value);
}

//ændrer status på elementet: logstatus.
function toggle(text, url) {
    let logbutton = document.getElementById("logstatus");
    logbutton.innerText = text;
    logbutton.href = url;
}

//ændrer element til logout.
socket.on("logged-in", () => {
    toggle("Log out", "/logout");
});

//ændrer element til login.
socket.on("logged-out", () => {
    toggle("Log in", "/login");
});