import express,{ Request, Response } from "express";
import "./db"
import employeeRoute from "./routes/employeeRoute"
import departmentRoute from "./routes/departmentRoute"
import authRoute from "./routes/authRoute"
import leaveRoute from "./routes/leaveRoute"
import roleRouter from "./routes/roleRoute";

const app = express();
app.use(express.json())


// app.get("/",(req:Request,res:Response)=>{
//     res.send("employee maagemet is working successfully")
// })

app.use(employeeRoute);
app.use(departmentRoute);
app.use(authRoute)
app.use(leaveRoute)
app.use("/", roleRouter);

app.listen(3000,()=>{
    console.log("server running on port 3000 successfully");
    
})


