// import { model } from "mongoose";
import mongoose, {model} from "mongoose";
const roleSchema = new mongoose.Schema({
    roleName: {
        type: String,
        required: true,
        unique: true
    }
})

export const Role =  mongoose.model("Role",roleSchema)