const mongoose=require('mongoose')
const mongooseaggregatepaginate=require("mongoose-aggregate-paginate")
const jwt=require("jsonwebtoken")
const bcrypt=require("bcrypt")

const userSchema=mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    password:{
        type:String,
        required:[true,"Enter a password"]
    },
    avatar:{
        type:String,
        required:true
    },
    coverimage:{
        type:String,
    },
    watchhistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"video"
    }],
    refreshtoken:{
        type:String,
    }

},{timestamps:true})

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next()

    this.password=await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.ispasswordsame=async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateaccesstoken=function(){
    return jwt.sign({
        id:this._id,
        email:this.email,
        username:this.username
    },  
        process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generaterefreshtoken=function(){
    return jwt.sign({
        id:this._id,
    },  
        process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }) 
}

module.exports=mongoose.model("user",userSchema)