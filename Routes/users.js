const express = require('express');
const {UserModel} = require('../Models/user.model');
const userRoutes = express.Router();
const jwt = require('jsonwebtoken');

//-----------------------------------------  REGISTER  -----------------------------------------//
userRoutes.post("/register", async(req,res)=>{
    const {phone_number,priority } = req.body;
    try {
        const checkUser = await UserModel.find({phone_number});
        if(checkUser.length>0){
            res.send({"msg":"User Already Registered"});
        }
        else{
            const user = new UserModel({phone_number,priority });
            await user.save()
            res.send({"msg":"User Registered Sucessfully"});
        }
            
    } catch (error) {
        res.send({"msg":error.message});
    }
})

//-----------------------------------------  LOGIN  -----------------------------------------//

userRoutes.post("/login", async(req,res)=>{
    const {phone_number} = req.body;
   try {
    const user = await UserModel.find({phone_number});
    if(user.length>0){  
           const token = jwt.sign({user:user[0]._id}, "openInApp");
           res.send({"msg":"Login Successfully", token:token})
    }
    else{
        res.send({"msg":"Invalid Phone Number"});
    }
   } catch (error) {
    res.send({"msg":error.message});
   }        
})

module.exports = {userRoutes};
