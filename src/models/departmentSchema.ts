import mongoose from "mongoose";

const  departmentSchema=new mongoose.Schema(
    {
        name:{
            type:String,
            require:true,
            unique:true
        },
        description:{
            type:String
        },
        isDeleted:{
            type:Boolean,
            default:false
        }
    },
    {
        timestamps:true
    }
)

export const Department=mongoose.model("Department",departmentSchema)