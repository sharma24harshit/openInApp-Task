const express = require('express');
const {connection} = require("./db");
const {taskRoutes} = require('./Routes/tasks');
const {subTaskRoutes} = require('./Routes/subTasks');
const {userRoutes} = require('./Routes/users');
const errorHandler = require('./middleware/errorHandler');
require("dotenv").config()

const app = express();

app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Home page of Todo app")
})

// Routes
app.use('/tasks', taskRoutes);
app.use('/subtasks', subTaskRoutes);
app.use('/users', userRoutes);

// Error handling middleware
app.use(errorHandler);

app.listen(process.env.PORT , async()=>{
    try {
        await connection
        console.log("connected to db");
    } catch (error) {
        console.log(error);
    }
    console.log(`Server is running at ${process.env.PORT}`)
})