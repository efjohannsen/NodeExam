//opretter socket til serveren.
const socket = io();

//kaldes ved load af html side.
function loginStatus() {
    const loggedIn = getCookie("loggedIn");
    if(loggedIn === "true") {
        toggle("Log out", "/logout");
    } else {
        toggle("Log in", "/login");
    }
}

//returnerer værdien for en navngiven cookie.
function getCookie(cname) {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

//ændrer status på elementet: #logstatus.
function toggle(text, url) {
    let logbutton = document.getElementById("logstatus");
    logbutton.innerText = text;
    logbutton.href = url;
}

//ændrer cookie til logged-in: true.
socket.on("logged-in", () => {
    document.cookie = "loggedIn=true" + ";path=/";
});

//ændrer cookie til logged-in: false.
socket.on("logged-out", () => {
    document.cookie = "loggedIn=false" + ";path=/";
});