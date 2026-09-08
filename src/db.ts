// mongoDB connection
import mongoose from "mongoose";
import process from "process";
import dotenv from "dotenv"

dotenv.config()

mongoose.connect(process.env.MONGO_URI as string)
.then(()=>{
    console.log("dataase connected successfully");
    console.log("Database name:", mongoose.connection.name);
  
})
.catch((err)=>{
    console.log(err);
    
})

