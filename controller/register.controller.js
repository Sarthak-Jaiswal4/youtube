const userSchema=require("../models/user.model.js")
const {uploadoncloudinary}=require("../utils/fileupload.js")
const mongoose=require("mongoose")
const jwt=require("jsonwebtoken")

const generateaccessandrefreshtoken=async (userId)=>{
    try{
        const user=await userSchema.findById(userId)
        const accesstoken=user.generateaccesstoken()
        const refreshtoken=user.generaterefreshtoken()

        user.refreshtoken=refreshtoken
        await user.save({validateBeforeSvae:false})

        return {accesstoken,refreshtoken}
    }
    catch(error){
        console.log("something when wrong while creating token")
    }
}

const registeruser= async (req,res)=>{
    let{username,email,fullname,password}=req.body

    if([fullname,email,username,password].some((field)=>
        field?.trim()==="")
    )
    {
        console.log("not filled the field")
    }

    let existeduser=await userSchema.findOne({
        $or:[{username}, {email}]
    })
    if(existeduser){ console.log("user already exist") }

    const avatarlocalpath =req.files?.avatar[0]?.path;
    const coverimagelocalpath =req.files?.coverimage[0]?.path;

    const avatar=await uploadoncloudinary(avatarlocalpath)
    const coverimage=await uploadoncloudinary(coverimagelocalpath)

    if(!avatar){
        console.log("Avatar not here")
    }

    let createduser=await userSchema.create({
        username,
        fullname,
        avatar:avatar.url,
        coverimage:coverimage?.url ||"",
        email,
        password,
    })

    const realuser=await userSchema.findById(createduser._id).select(
        "-password -refreshtoken"
    )

    if(!realuser){
        console.log("something went wrong during registering")
    }

    return res.status(201).json(createduser)
}

const loginuser= async (req,res)=>{
    let{email,password,username}=req.body

    if(!(email || username)){
        console.log("Enter the field")
    }
    
    let user=await userSchema.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        console.log("No user found")
    }

    const ispassvalid=await user.ispasswordsame(password)
    if(!ispassvalid){ console.log("Password incorrect")}

    const{accesstoken,refreshtoken} = await generateaccessandrefreshtoken(user._id)

    const loggedinuser= await userSchema.findById(user._id).select("-password -refreshtoken")

    const option={
        httpOnly:true,
        secure:true
    }

    return  res.status(200).cookie("accesstoken", accesstoken, option) .cookie("refreshtoken", refreshtoken, option).
    json({loggedinuser},"user logged in successfully")
}

const logoutuser=async (req,res)=>{
    await userSchema.findByIdAndUpdate(
        req.user._id,
        {
            $set:{refreshtoken:undefined}
        },
        {
            new:true
        }
    )
    const option={
        httpOnly:true,
        secure:true
    }

    return res.status(200).clearCookie("accesstoken",option).clearCookie("refreshtoken",option).json({},"user logged out")
}

const refreshAccesstoken=async (req,res)=>{
    const incomingrefreshtoken=req.cookies.refreshtoken

    if(!incomingrefreshtoken) {console.log("Unauthorized access")}

    try {
        const decodedtoken=jwt.verify(incomingrefreshtoken,process.env.REFRESH_TOKEN_SECRET)
    
        const user=await userSchema.findById(decodedtoken._id)
        if(!user) {console.log("invalid refresh token")}
    
        if(incomingrefreshtoken !== user.refreshtoken){
            console.log("refresh token is expired or used")
            process.exit(1)
        }
    
        const {accesstoken,newrefreshtoken}=await generateaccessandrefreshtoken(user._id)
    
        return res.status(200).cookie("accesstoken",accesstoken).cookie("refreshtoken",newrefreshtoken).json({accesstoken,refreshtoken: newrefreshtoken},"Access token refreshed")
    
    } catch (error) {
        console.log("refreshtoken error")
    }
}

const changeCurrentuserpassword=async (req,res)=>{
    const {oldpassword,newpassword}=req.body

    const user=await userSchema.findById(req.user._id)
    const ispasswordcorrect=user.ispasswordsame(oldpassword)
    if(!ispasswordcorrect) { console.log("Wrong password")}

    user.password=newpassword
    await user.save({validateBeforeSave:false})

    return re.status(200).json({},"password changed successfully")
}

const getcurrentuser=async(req,res)=>{
    return res.status(200).json(200,req.user,"current user fetched succesfullt")
}

const changeavatar=async (req,res)=>{
    const avatarlocalpath=req.file.path

    const avatar=await uploadoncloudinary(avatarlocalpath) 
    if(!avatar.url) {console.log("error while updating avatar image")}

    const user=await userSchema.userById(req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).json(200,user,"avatar updated successfully")
}

const getuserprofile=async (req,res)=>{
    const {username}=req.params

    if(!username) {
        console.log("username not found")
    }

    const channel=await userSchema.aggreagte([
        {   
            $match:{
                username:username,
            },
        },
        {
            $lookup:{
                from:"suscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            },
        },
        {
            $lookup:{
                from:"suscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedto"
            },
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelssubribedtocount:{
                    $size: "$subscribedto"
                },
                issubscribed:{
                    $cond:{
                        if:{$in: [req.user._id, "$subscribers.subscriber"]},
                        then:true,
                        else:false,
                    }
                }
            },
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelssubribedtocount:1,
                issubscribed:1,
                avatar:1,
                coverimage:1,
                email:1,
            }  
        }
    ])

    if(!channel.length) {
        console.log("channel does not exists")
    }

    return res.status(200).json(channel[0],"user channel fetched successfully")
}

module.exports ={registeruser,loginuser,logoutuser,refreshAccesstoken,changeCurrentuserpassword,getcurrentuser,changeavatar,getuserprofile}