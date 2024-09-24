const mongoose=require('mongoose')

mongoose.connect(`${process.env.MONGODB_URL}/learning1`)
.then(()=>{
    console.log("connected")
})
.catch((err)=>{
    console.log(err.msg)
    process.exit(1)
})