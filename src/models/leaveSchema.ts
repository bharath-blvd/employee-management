import mongoose from "mongoose";

const leaveSchema=new mongoose.Schema(
    {
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },
        department:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: true
        },
        leaveType:{
            type:String,
            enum:["annual","sick"],
            required:true
            
        },
        fromDate:{
            type:Date,
            require:true
        },
        toDate:{
            type:Date,
            require:true
        },
        reason:{
            type:String,
            require:true
        },
        leaveDays:{
            type:Number,
            required:true
        


        },
        status:{
            type:String,
            enum:["pending","approved","rejected"],
            default:"pending"
        },
        isDeleted: {
        type: Boolean,
        default: false
}

    },
    {
        timestamps:true
    }
)

export const Leave =  mongoose.model("Leave",leaveSchema)