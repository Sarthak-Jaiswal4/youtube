const express=require('express')
const router=express.Router()
const {upload}=require('../middleware/multer.js')
const {registeruser, loginuser,logoutuser,refreshAccesstoken}=require('../controller/register.controller.js')
const {verifyjwt}=require("../middleware/auth.middleware.js")

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverimage",
            maxCount:1
        }
    ]),
    registeruser
)

router.route("/login").post(loginuser)

router.route("/logout").post(verifyjwt,logoutuser)
router.route("/refreshtoken").post(refreshAccesstoken)

module.exports=router