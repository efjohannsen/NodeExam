//moduler.
require("dotenv").config();
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./util/mysql/mysql.js");
const authLimiter = require("./util/ratelimit/ratelimiter.js");
const cookieParser = require("cookie-parser");
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const users = {};

//køres når en user connecter til serveren.
io.on("connection", socket => {
    socket.on("new-user", name => {
        users[socket.id] = name;
        socket.broadcast.emit("user-connected", name);
    });
    socket.on("send-chat-message", message => {
        socket.broadcast.emit("chat-message", {message: message, name: users[socket.id]});
    });
    socket.on("disconnect", () => {
        socket.broadcast.emit("user-disconnected", users[socket.id]);
        delete users[socket.id];
    });
});

//appen kan parse cookies.
app.use(cookieParser());

//appen kan håndtere json format.
app.use(express.json());

//appen kan parse post objekter som strings eller arrays.
app.use(express.urlencoded({extended: true}));

//static filer serveres fra public folderen.
app.use(express.static(__dirname + "/public"));

//HTTP request handler for /index.
app.get("/index", (req, res) => {
    return res.sendFile(__dirname + "/index/index.html");
});

app.get("/", (req, res) => {
    return res.sendFile(__dirname + "/public/index/index.html");
});

app.get("/register", (req, res) => {
    return res.sendFile(__dirname + "/public/register/register.html");
});

app.get("/login", (req, res) => {
    return res.sendFile(__dirname + "/public/login/login.html");
});

app.get("/restricted", (req, res) => {
    return res.sendFile(__dirname + "/public/restricted/restricted.html");
});

//nedenstående endpoint kræver authorization.
app.get("/fetch", authenticateToken, async (req, res) => {
    const users = await pool.execute("SELECT username, email FROM users");
    if(users[0] === undefined) {
        return res.status(404).send(`No users found!`);
    }
    return res.send(users[0]);
});

//nedenstående endpoint kræver authorization.
app.get("/users", authenticateToken, (req, res) => {
    return res.sendFile(__dirname + "/public/users/users.html");
});

//nedenstående endpoint kræver authorization.
app.get("/chat", authenticateToken, (req, res) => {
    return res.sendFile(__dirname + "/public/chat/chat.html");
});

//nedenstående endpoint kræver authorization.
app.get("/profile", authenticateToken, (req, res) => {
    return res.sendFile(__dirname + "/public/profile/profile.html");
});

//change password.
app.post("/profile", (req, res) => {
    const pw1 = req.body.change_pw_1;
    const pw2 = req.body.change_pw_2;
    if(pw1 !== pw2) {
        return res.send("Typed passwords are not identical, please try again!");
    }
    const accessToken = req.cookies.accessToken;
    if(accessToken === undefined) {
        return res.redirect("/restricted");
    }
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, async (error, user) => {
        if(error) {
            return res.send("Accesstoken expired. Please refresh accesstoken to change password!");
        }
        try {
            const hashedPassword = await bcrypt.hash(pw1, 10);
            await pool.execute("UPDATE users SET password = ? WHERE username = ?", [hashedPassword, user.name]);
        } catch {
            return res.send("Failed to update password!");
        }
        return res.redirect("/profile");
    });
});

//middleware authenticate function.
function authenticateToken(req, res, next) {
    const accessToken = req.cookies.accessToken;
    if(accessToken === undefined) {
        return res.redirect("/restricted");
    }
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
        if(error) {
            return res.status(403).send("Accesstoken expired. Please refresh accesstoken!");
        }
        next();
    });
}

//opretter og gemmer user credentials i database.
app.post("/register", authLimiter, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await pool.execute("INSERT INTO users SET username = ?, password = ?, email = ?", [req.body.username, hashedPassword, req.body.email]);
        return res.redirect("/login");
    } catch(error) {
        return res.status(500).send(`Server error: ${error}`);
    }
});

//validerer brugernavn og password og gemmer dernæst to cookies.
app.post("/login", authLimiter, async (req, res) => {
    try {
        const userName = req.body.username;
        const plainTextPassword = req.body.password;
        const userResult = await pool.execute("SELECT id, password FROM users WHERE username = ?", [userName]);
        if(userResult[0][0] === undefined) {
            return res.status(404).send(`User: ${userName} not found!`);
        } else if (await bcrypt.compare(plainTextPassword, userResult[0][0].password)) {
            io.sockets.emit("logged-in");
            const id = userResult[0][0].id;
            const user = {name: userName};
            const accessToken = generateAccessToken(user);
            const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "60m"});
            await pool.execute("DELETE FROM refresh_tokens WHERE id = ?", [id]);
            await pool.execute("INSERT INTO refresh_tokens SET id = ?, token = ?", [id, refreshToken]);
            res.cookie("accessToken", accessToken, {httpOnly: true});
            res.cookie("refreshToken", refreshToken, {httpOnly: true});
            return res.redirect("/profile");
        } else {
            return res.status(401).send("Wrong password!");
        }
    } catch(error) {
        return res.status(500).send(`Server error: ${error}`);
    }
});

//fornyer en accesstoken på baggrund af en eksisterende refreshtoken.
app.get("/refreshtoken", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if(refreshToken === undefined) {
        return res.redirect("/restricted");
    }
    const storedToken = await pool.execute("SELECT token FROM refresh_tokens WHERE token = ?", [refreshToken]);
    if(storedToken[0][0] === undefined) {
        return res.redirect("/restricted");
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, user) => {
        if(error) {
            return res.redirect("/restricted");
        }
        const accessToken = generateAccessToken({name: user.name});
        res.cookie("accessToken", accessToken, {httpOnly: true});
        return res.redirect("/profile");
    });
});

//function der skaber accesstokens med begrænset levetid.
function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"});
}

//logger brugeren ud og fjerner begge cookies.
app.get("/logout", async (req, res) => {
    refreshToken = req.cookies.refreshToken;
    if(refreshToken !== undefined) {
        io.sockets.emit("logged-out");
        await pool.execute("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);
        res.clearCookie("refreshToken");
        res.clearCookie("accessToken");
        return res.redirect("/login");
    } else {
        return res.send("You are not logged in!");
    }
});

//redirect all non-handled endpoints to notfound.
app.get("/*", (req, res) => {
    return res.sendFile(__dirname + "/public/notfound/notfound.html");
});

//hvis porten er defineret i .env benyttes den ellers sættes den til nedenstående.
const port = process.env.PORT || 8080;

//binder webserver til port.
server.listen(port, (error) => {
    if(error) {
        console.log(`Server caught an error: ${error}`);
    } else {
        console.log(`Server running on port: ${port}`);
    }
});