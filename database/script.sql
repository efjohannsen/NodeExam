DROP DATABASE IF EXISTS users_db;
CREATE DATABASE users_db CHARACTER SET utf8 COLLATE utf8_general_ci;
USE users_db;

CREATE TABLE users (
    id INT(10) NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE,
    password CHAR(100),
    email VARCHAR(100),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=5;

INSERT INTO users (id, username, password, email) VALUES
    (1, 'John', '123456', '123@gmail.com'),
    (2, 'Jonas', '123', 'abc@gmail.com');