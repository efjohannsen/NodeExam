DROP DATABASE IF EXISTS users_db;
CREATE DATABASE users_db CHARACTER SET utf8 COLLATE utf8_general_ci;
USE users_db;

CREATE TABLE users (
    id INT(10) NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO users (id, username, password, email) VALUES (1, 'JohnDoe', 'john', 'johndoe@gmail.com');

CREATE TABLE refresh_tokens (
    token VARCHAR(150) UNIQUE NOT NULL,
    id INT(10) UNIQUE NOT NULL,
    FOREIGN KEY (id) REFERENCES users(id)
);

INSERT INTO refresh_tokens (id, token)
VALUES (1, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoicXEiLCJpYXQiOjE2MDgzMDc3ODB9.khCI8J-izc-GHR-6X72Cc8mAri5CPU6hxaMeuJRD48A");

SHOW DATABASES;
SHOW TABLES;
CREATE USER 'user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON users_db.* TO 'user'@'localhost';