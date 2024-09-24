const express=require('express')
const app=express()
require('dotenv').config()
const db=require("./config/mongoose-connection.js")
const cookieparser=require("cookie-parser")

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieparser())

const userRouter=require('./routes/user.routes.js')
app.use("/user", userRouter)

app.listen(`${process.env.PORT}`)