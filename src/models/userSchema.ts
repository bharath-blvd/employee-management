// import mongoose, { model } from "mongoose";
// const userSchema = new mongoose.Schema(
//     {
//     name:{
//         type:String,
//         required:true
//     },
//     email:{
//         type:String,
//         unique:true,
//         required:true
//     },
//     password:{
//         type:String,
//         required:true
//     },
//     role:{
//         type:String,
//         enum:["admin","employee","hr","manager"],
//         required:true
//     },
//     department:{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Department"
//     },
//     isDeleted:{
//         type:Boolean,
//         default:false
//     }
// })

// export const User =  mongoose.model("User",userSchema)