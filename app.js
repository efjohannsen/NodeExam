//importerer moduler.
const express = require("express");
const bcrypt = require("bcrypt");

//instancierer express.
const app = express();

//appen kan håndtere json format for POST requests.
app.use(express.json());

//appen kan parse objektet som strings eller arrays.
app.use(express.urlencoded({extended: true}))

//importerer dotenv modulet.
require("dotenv").config();

//hvis porten er defineret i .env benyttes den ellers sættes den til nedenstående.
const port = process.env.PORT || 9000;

//static filer serveres fra public folderen som root.
app.use(express.static(__dirname + "/public"));

//HTTP request handlers.
app.get("/index", (req, res) => {
    res.sendFile(__dirname + "/index/index.html");
});

app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/public/register/register.html");
});





const users = [];

app.get("/test", (req, res) => {
    res.json(users);
});

app.post("/register", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = {name: req.body.username, password: hashedPassword, email: req.body.email};
        users.push(user);
        res.status(201).send();
    } catch {
        res.status(500).send();
    }
});

app.post("/test/login", async (req, res) => {
    const user = users.find(user => user.name === req.body.name);
    if(user == null) {
        return res.status(400).send("Can't find user");
    }
    try {
        if(await bcrypt.compare(req.body.password, user.password)) {
            res.send("Succes!");
        } else {
            res.send("Not allowed!")
        };
    } catch {
        res.status(501).send();
    }
});



//redirect all non handled endpoints to index.
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