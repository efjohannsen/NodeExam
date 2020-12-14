//importerer moduler.
const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const authLimiter = require("./util/ratelimiter.js");

//instancierer express.
const app = express();

//appen kan håndtere json format for POST requests.
app.use(express.json());

//appen kan parse objektet som strings eller arrays.
app.use(express.urlencoded({extended: true}));

//static filer serveres fra public folderen som root.
app.use(express.static(__dirname + "/public"));

//importerer dotenv modulet.
require("dotenv").config();

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
    res.sendFile(__dirname + "/index/index.html");
});

app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/public/register/register.html");
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/public/login/login.html");
});

app.post("/register", authLimiter, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await pool.execute("INSERT INTO users SET username = ?, password = ?, email = ?", [req.body.username, hashedPassword, req.body.email]);
        res.redirect("/login");
    } catch(error) {
        res.status(500).send(error);
    }
});

app.post("/login", authLimiter, async (req, res) => {
    try {
        const userName = req.body.username;
        const plainTextPassword = req.body.password;
        const hashedPassword = await pool.execute("SELECT password FROM users WHERE username = ?", [userName]);
        //not defined || empty array.
        if(hashedPassword[0][0] === undefined || hashedPassword[0][0].length === 0) {
            res.status(404).send(`User: ${userName} not found!`);
        } else if (await bcrypt.compare(plainTextPassword, hashedPassword[0][0].password)) {
            res.redirect("/index");
        } else {
            res.status(401).send("Wrong password!");
        }
    } catch(error) {
        res.status(500).send(error);
    }
});

//redirect all non-handled endpoints to index.
app.get("/*", (req , res) => {
    res.redirect("/index");
});

//binder webserver til port.
app.listen(port, (error)=> {
    if(error) {
        console.log(`Server running on: ${error}`);
    } else {
    console.log(`Server running on: ${port}`);
    }
});