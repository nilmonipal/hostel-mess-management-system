require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = require('./configs/auth.configs').PORT;
const db_config = require('./configs/db.configs');
const user_model = require('./src/models/user.models')
const bcrypt = require("bcrypt")
const authRoutes = require('./src/routes/auth.routes');

// Middleware
app.use(express.json());

mongoose.connect(`${db_config.db_url}/${db_config.db_name}`);
const db = mongoose.connection;

db.on('error', () => {
    console.log("Error while connecting to the database");
});

db.once('open', () => {
    console.log("Successfully connected to the database");
    init()
});


async function init() {
    try {
        let user = await user_model.findOne({ role: "admin" });
        if (user) {
            console.log("Admin is already present.");
            return;
        }
    } catch (error) {
        console.log("Error while checking for Admin :", error);
    }

    try {
        user = await user_model.create({
            username: "Nilmoni",
            userId: "admin1",
            password: bcrypt.hashSync("Admin@123", 8),
            email: "nilmoni@gmail.com",
            phone: "1234567890",
            role: "admin",
        });
        console.log("Admin is created");
    } catch (error) {
        console.log("Error while creating a Admin :", error);
    }
}

//stiching the routes
authRoutes(app);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

