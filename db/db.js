const mongoose = require("mongoose");
const dotenv = require("dotenv").config();


const connect= async()=>{

     console.log(process.env.DATABASE);
    await mongoose.connect(process.env.DATABASE)
    
    console.log("connected to the database");
}
module.exports= connect;