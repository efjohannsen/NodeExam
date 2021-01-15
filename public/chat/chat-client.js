//opretter socket til serveren.
const socket = io();

const messageContainer = document.getElementById("message-container");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");

//navn på ny bruger broadcastes.
const username = prompt("What is your name?");
appendMessage("You joined the chat.");
socket.emit("new-user", username);

//skriver besked i chatten.
socket.on("chat-message", data => {
    appendMessage(`${data.name}: ${data.message}`);
});

//skriver navn på ny user i chatten.
socket.on("user-connected", name => {
    appendMessage(`${name} joined the chat.`);
});

//skriver navn på disconnected user i chatten.
socket.on("user-disconnected", name => {
    appendMessage(`${name} left the chat.`);
});

//forhindrer formen i at blive postet til serveren ved submit.
//sender besked fra client til server ved submit.
messageForm.addEventListener("submit", e => {
    e.preventDefault();
    const message = messageInput.value;
    socket.emit("send-chat-message", message);
    appendMessage(`You: ${message}`);
    messageInput.value = "";
    window.scrollTo(0,document.body.scrollHeight);
});

//funktion der skaber et nyt div element for hver besked og appender det til message-container div.
function appendMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}