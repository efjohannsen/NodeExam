//importerer moduler.
const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

//instancierer express.
const app = express();

//appen kan håndtere json format for POST requests.
app.use(express.json());

//appen kan parse objektet som strings eller arrays.
app.use(express.urlencoded({extended: true}))

//importerer dotenv modulet.
require("dotenv").config();

//hvis porten er defineret i .env benyttes den ellers sættes den til nedenstående.
const port = process.env.PORT || 8080;

//mysql thread pool
const pool = mysql.createPool({
    host        : process.env.DB_HOST,
    user        : process.env.DB_USER,
    password    : process.env.DB_PASSWORD,
    database    : process.env.DB_DATABASE,
    port        : process.env.DB_PORT,
    waitForConnections  : true,
    connectionLimit     : 10,
    queueLimit          : 0
});

//static filer serveres fra public folderen som root.
app.use(express.static(__dirname + "/public"));

//HTTP request handlers.
app.get("/index", (req, res) => {
    res.sendFile(__dirname + "/index/index.html");
});

app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/public/register/register.html");
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/public/login/login.html");
});





//const users = [];
/*
app.get("/test", (req, res) => {
    //res.json(users);
    //await pool.execute('SELECT * FROM users_db);
});

app.post("/register", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
//        const user = {name: req.body.username, password: hashedPassword, email: req.body.email};
//        users.push(user);
//        res.status(201).send("User successfully registered!");
        await pool.execute('INSERT INTO users_db SET username = ?, password = ?, email = ?', [req.body.username, hashedPassword, req.body.email])
        res.redirect("/login");
    } catch {
        res.status(500).send("Server unable to create user!");
    }
});

app.post("/login", async (req, res) => {
    const user = users.find(user => user.name === req.body.username);
    if(user == null) {
        return res.status(400).send("Server unable to locate user!");
    }
    try {
        if(await bcrypt.compare(req.body.password, user.password)) {
            res.send("Log in successful!");
        } else {
            res.status(401).send("Wrong password!");
        };
    } catch {
        res.status(501).send("Server unable to accomodate request!");
    }
});*/



//redirect all non-handled endpoints to index.
app.get("/*", (req , res) => {
    res.redirect("/index");
});

//binder webserver til port
app.listen(port, (error)=> {
    if(error) {
        console.log(`Server running on: ${error}`);
    } else {
    console.log(`Server running on: ${port}`);
    }
});