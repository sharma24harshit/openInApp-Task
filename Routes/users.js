const express = require('express');
const {UserModel} = require('../Models/user.model');
const userRoutes = express.Router();
const jwt = require('jsonwebtoken');

userRoutes.post("/login", async(req,res)=>{
    const {phone_number} = req.body;
   try {
    const checkUser = await UserModel.find({phone_number});
    if(checkUser.length>0){
        const token = jwt.sign({user:checkUser[0]._id}, "openInApp");
           res.send({"msg":"Login Successfully", token:token});
    }
    else{
        const user = new UserModel({phone_number });
            await user.save()
            const token = jwt.sign({user:user._id}, "openInApp");
           res.send({"msg":"Login Successfully", token:token});
    }
   } catch (error) {
    res.send({"msg":error.message});
   }        
})

module.exports = {userRoutes};
