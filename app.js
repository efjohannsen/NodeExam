//importerer moduler.
const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const authLimiter = require("./util/ratelimiter.js");
const cookieParser = require("cookie-parser");
require("dotenv").config();

//instancierer express.
const app = express();

//appen kan parse cookies.
app.use(cookieParser());

//appen kan håndtere json format.
app.use(express.json());

//appen kan parse objektet som strings eller arrays.
app.use(express.urlencoded({extended: true}));

//static filer serveres fra public folderen som root.
app.use(express.static(__dirname + "/public"));

//hvis porten er defineret i .env benyttes den ellers sættes den til nedenstående.
const port = process.env.PORT || 8080;

//skaber en thread pool.
const pool = mysql.createPool({
    host        : process.env.DB_HOST,
    user        : process.env.DB_USER,
    password    : process.env.DB_SECRET,
    database    : process.env.DB_DBNAME,
    port        : process.env.DB_PORT,
    waitForConnections  : true,
    connectionLimit     : 10,
    queueLimit          : 0
});

//HTTP request handler for /index.
app.get("/index", (req, res) => {
    return res.sendFile(__dirname + "/index/index.html");
});

app.get("/register", (req, res) => {
    return res.sendFile(__dirname + "/public/register/register.html");
});

app.get("/login", (req, res) => {
    return res.sendFile(__dirname + "/public/login/login.html");
});

//nedenstående endpoint kræver authorization.
app.get("/profile", authenticateToken, (req, res) => {
    return res.sendFile(__dirname + "/public/profile/profile.html");
});

//middleware authenticate function.
function authenticateToken(req, res, next) {
    const accessToken = req.cookies.accessToken;
    if(accessToken === undefined) {
        return res.status(401).send("Access-cookie not found/expired. Please log-in again!");
    }
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
        if(error) {
            return res.sendStatus(403);
        }
        req.user = user;
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

//validerer brugernavn og password og skaber dernæst to cookies.
app.post("/login", authLimiter, async (req, res) => {
    try {
        const userName = req.body.username;
        const plainTextPassword = req.body.password;
        const userResult = await pool.execute("SELECT id, password FROM users WHERE username = ?", [userName]);
        if(userResult[0][0] === undefined) {
            return res.status(404).send(`User: ${userName} not found!`);
        } else if (await bcrypt.compare(plainTextPassword, userResult[0][0].password)) {
            const id = userResult[0][0].id;
            const user = {name: userName};
            const accessToken = generateAccessToken(user);
            const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
            await pool.execute("DELETE FROM refresh_tokens WHERE id = ?", [id]);
            await pool.execute("INSERT INTO refresh_tokens SET id = ?, token = ?", [id, refreshToken]);
            res.cookie("accessToken", accessToken, {httpOnly: true});
            res.cookie("refreshToken", refreshToken, {maxAge: 1000000, httpOnly: true});
            return res.redirect("/index");
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
        return res.status(401).send("Refreshtoken is non-existant and cannot be refreshed - log in again!");
    }
    const storedToken = await pool.execute("SELECT token FROM refresh_tokens WHERE token = ?", [refreshToken]);
    if(storedToken[0][0] === undefined) {
        return res.status(403).send("Restricted area!");
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, user) => {
        if(error) {
            return res.status(403).send("Restricted area!");
        }
        const accessToken = generateAccessToken({name: user.name});
        res.cookie("accessToken", accessToken, {httpOnly: true});
        return res.send("Accesstoken renewed!");
    });
});

//function der skaber access tokens med begrænset levetid.
function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15s"});
}

//logger brugeren ud og fjerner begge cookies.
app.get("/logout", async (req, res) => {
    refreshToken = req.cookies.refreshToken;
    if(refreshToken !== undefined) {
        await pool.execute("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);
        res.clearCookie("refreshToken");
        res.clearCookie("accessToken");
        return res.status(204).send("You are now logged out!");
    } else {
        return res.send("You are not logged in/cookie expired!");
    }
});

//redirect all non-handled endpoints to index.
app.get("/*", (req , res) => {
    return res.redirect("/index");
});

//binder webserver til port.
app.listen(port, (error)=> {
    if(error) {
        console.log(`Server caught an error: ${error}`);
    } else {
    console.log(`Server running on port: ${port}`);
    }
});