const jwt=require("jsonwebtoken")
const userSchema=require("../models/user.model")

const verifyjwt= async (req,res,next)=>{
    try {
        const token=req.cookies?.accesstoken
        
        if(!token) console.log("Unauthorised request")
    
        const decoded=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user=await userSchema.findById(decoded._id).select("-refreshtoken -password")
    
        if(!user)
            { console.log("invalid access token")}
    
        req.user=user;
        next()
    } catch (error) {
        console.log(error.msg||"INVALID ACCESS TOKEN")
    }
}

module.exports={verifyjwt}