/*
const express = require("express");

app = express();

app.get("/chat", (req, res) => {
    return res.sendFile(__dirname + "/chat.html");
});

app.listen(80);
*/
const io = require("socket.io")(3000);

//funktion der kaldes ved initial connect.
io.on("connection", socket => {
    socket.emit("chat-message", "Hello World!");
});